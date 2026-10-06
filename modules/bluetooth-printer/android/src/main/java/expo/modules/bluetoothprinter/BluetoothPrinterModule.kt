package expo.modules.bluetoothprinter

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.UUID

/** Serial Port Profile. Cheap ESC/POS printers such as the GOOJPRT PT-210 listen on it. */
private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

/** The printer drops bytes that are still buffered when the socket closes. */
private const val DRAIN_DELAY_MS = 800L

/** The Bluetooth radio needs a short pause after a failed socket before the next attempt. */
private const val RETRY_DELAY_MS = 300L

class BluetoothUnavailableException : CodedException("ERR_BLUETOOTH_UNAVAILABLE", "This phone has no Bluetooth.", null)
class BluetoothOffException : CodedException("ERR_BLUETOOTH_OFF", "Bluetooth is turned off.", null)
class BluetoothPermissionException :
  CodedException("ERR_BLUETOOTH_PERMISSION", "Allow Nearby devices for this app to use the printer.", null)
class PrinterNotPairedException :
  CodedException("ERR_PRINTER_NOT_PAIRED", "The printer is not paired with this phone.", null)
class PrinterConnectException(cause: Throwable?) :
  CodedException("ERR_PRINTER_CONNECT", "Could not reach the printer. Check that it is on and nearby.", cause)

class BluetoothPrinterModule : Module() {
  private val printLock = Mutex()

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  override fun definition() = ModuleDefinition {
    Name("BluetoothPrinter")

    Function("isEnabled") {
      adapterOrNull()?.isEnabled == true
    }

    AsyncFunction("getPairedDevices") {
      val adapter = readyAdapter()
      bondedDevices(adapter).map { device ->
        mapOf("name" to (deviceName(device) ?: device.address), "address" to device.address)
      }
    }

    AsyncFunction("printAsync") Coroutine { address: String, data: ByteArray ->
      printLock.withLock {
        withContext(Dispatchers.IO) {
          try {
            val adapter = readyAdapter()
            val device = bondedDevices(adapter).firstOrNull { it.address.equals(address, ignoreCase = true) }
              ?: throw PrinterNotPairedException()
            send(adapter, device, data)
          } catch (error: CodedException) {
            throw error
          } catch (error: SecurityException) {
            throw BluetoothPermissionException()
          } catch (error: Exception) {
            throw PrinterConnectException(error)
          }
        }
      }
    }
  }

  private fun adapterOrNull(): BluetoothAdapter? =
    (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

  private fun readyAdapter(): BluetoothAdapter {
    val adapter = adapterOrNull() ?: throw BluetoothUnavailableException()
    if (!hasConnectPermission()) {
      throw BluetoothPermissionException()
    }
    if (!adapter.isEnabled) {
      throw BluetoothOffException()
    }
    return adapter
  }

  private fun hasPermission(permission: String): Boolean =
    context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

  private fun hasConnectPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || hasPermission(Manifest.permission.BLUETOOTH_CONNECT)

  @SuppressLint("MissingPermission")
  private fun bondedDevices(adapter: BluetoothAdapter): List<BluetoothDevice> =
    adapter.bondedDevices?.toList().orEmpty()

  @SuppressLint("MissingPermission")
  private fun deviceName(device: BluetoothDevice): String? = device.name

  @SuppressLint("MissingPermission")
  private suspend fun send(adapter: BluetoothAdapter, device: BluetoothDevice, data: ByteArray) {
    stopDiscovery(adapter)
    val socket = connect(device)
    try {
      socket.outputStream.apply {
        write(data)
        flush()
      }
      delay(DRAIN_DELAY_MS)
    } catch (error: IOException) {
      throw PrinterConnectException(error)
    } finally {
      runCatching { socket.close() }
    }
  }

  /**
   * Android 12+ requires BLUETOOTH_SCAN for cancelDiscovery. Listing paired printers only needs
   * CONNECT, so a missing SCAN permission used to crash print with an unmapped SecurityException.
   */
  @SuppressLint("MissingPermission")
  private fun stopDiscovery(adapter: BluetoothAdapter) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || hasPermission(Manifest.permission.BLUETOOTH_SCAN)) {
        adapter.cancelDiscovery()
      }
    } catch (_: SecurityException) {
    }
  }

  /**
   * Cheap SPP printers often reject the secure SDP socket. Try insecure SPP first, then the
   * device's advertised UUIDs, then RFCOMM channel 1 (the usual port when SDP is missing).
   */
  @SuppressLint("MissingPermission")
  private suspend fun connect(device: BluetoothDevice): BluetoothSocket {
    var lastError: Exception? = null
    for (factory in socketFactories(device)) {
      val socket = try {
        factory()
      } catch (error: Exception) {
        lastError = error
        continue
      }
      try {
        socket.connect()
        return socket
      } catch (error: IOException) {
        lastError = error
        runCatching { socket.close() }
        delay(RETRY_DELAY_MS)
      }
    }
    throw PrinterConnectException(lastError)
  }

  @SuppressLint("MissingPermission")
  private fun socketFactories(device: BluetoothDevice): List<() -> BluetoothSocket> {
    val uuids = linkedSetOf(SPP_UUID)
    device.uuids?.forEach { parcel -> uuids.add(parcel.uuid) }
    val factories = mutableListOf<() -> BluetoothSocket>()
    for (uuid in uuids) {
      factories.add { device.createInsecureRfcommSocketToServiceRecord(uuid) }
      factories.add { device.createRfcommSocketToServiceRecord(uuid) }
    }
    factories.add { rfcommChannel(device, insecure = true) }
    factories.add { rfcommChannel(device, insecure = false) }
    return factories
  }

  /** Hidden API: connect to RFCOMM channel 1 without an SDP lookup. */
  private fun rfcommChannel(device: BluetoothDevice, insecure: Boolean): BluetoothSocket {
    val method = device.javaClass.getMethod(
      if (insecure) "createInsecureRfcommSocket" else "createRfcommSocket",
      Int::class.javaPrimitiveType,
    )
    return method.invoke(device, 1) as BluetoothSocket
  }
}
