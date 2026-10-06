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
          val adapter = readyAdapter()
          val device = bondedDevices(adapter).firstOrNull { it.address.equals(address, ignoreCase = true) }
            ?: throw PrinterNotPairedException()
          send(adapter, device, data)
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

  private fun hasConnectPermission(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
      context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED

  @SuppressLint("MissingPermission")
  private fun bondedDevices(adapter: BluetoothAdapter): List<BluetoothDevice> =
    adapter.bondedDevices?.toList().orEmpty()

  @SuppressLint("MissingPermission")
  private fun deviceName(device: BluetoothDevice): String? = device.name

  @SuppressLint("MissingPermission")
  private suspend fun send(adapter: BluetoothAdapter, device: BluetoothDevice, data: ByteArray) {
    adapter.cancelDiscovery()
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

  /** Some printer firmware refuses the secure channel, so the insecure one is tried next. */
  @SuppressLint("MissingPermission")
  private fun connect(device: BluetoothDevice): BluetoothSocket {
    var lastError: IOException? = null
    val factories = listOf<(BluetoothDevice) -> BluetoothSocket>(
      { it.createRfcommSocketToServiceRecord(SPP_UUID) },
      { it.createInsecureRfcommSocketToServiceRecord(SPP_UUID) },
    )
    for (factory in factories) {
      val socket = factory(device)
      try {
        socket.connect()
        return socket
      } catch (error: IOException) {
        lastError = error
        runCatching { socket.close() }
      }
    }
    throw PrinterConnectException(lastError)
  }
}
