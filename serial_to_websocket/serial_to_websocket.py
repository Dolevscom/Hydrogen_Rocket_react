import asyncio
import logging
import random
import time

import serial
import serial.tools.list_ports
import websockets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MESSAGE_DELAY = 0.4


# Helper function to find an Arduino on an open serial port
def find_arduino_port(baud_rate=115200):
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if ("Arduino" in port.description or "ttyACM" in port.device or "ttyUSB" in port.device or
                'usbserial' in port.device):
            try:
                ser = serial.Serial(port.device, baud_rate)
                logger.info(f"Connected to {port.device}")
                time.sleep(2)  # Wait for the connection to be established properly
                return ser
            except Exception as e:
                logger.error(f"Could not open {port.device}: {e}")
    return None


# WebSocket handler that sends serial data to connected clients
async def arduino_websocket_handler(websocket, serial_connection):
    try:
        while True:
            # Read a line from the serial port
            data = serial_connection.readline().decode('utf-8').strip()
            if data:
                await websocket.send(data)
                logger.info(f"Sent: {data}")
    except serial.serialutil.SerialException:
        logger.error("Serial connection shut down.")
        serial_connection.close()
    except websockets.ConnectionClosed:
        logger.info("Client disconnected.")


async def virtual_websocket_handler(websocket, *args):
    value = 0  # Start at 0
    while True:
        # If value is at max, reset to 0 randomly to avoid predictable patterns
        if value >= 10:
            if random.random() < 0.3:  # 30% chance to reset to 0
                value = 0
            else:
                value = 10  # Hold 10 for some cycles without reset
        else:
            # Increment value by 0 or 1 to keep it non-decreasing
            value += random.choice([0, 1])

        message = f"{value}\n"
        await websocket.send(message)
        logger.info(f"Sent: {message.strip()}")
        time.sleep(MESSAGE_DELAY)


async def start_websocket_server(serial_connection, use_virtual_port=False):
    # Start the WebSocket server
    logger.info("Starting WebSocket server on ws://localhost:9001")
    handler = arduino_websocket_handler if not use_virtual_port else virtual_websocket_handler
    async with websockets.serve(lambda ws: handler(ws, serial_connection), 'localhost', 9001):
        await asyncio.Future()  # Keep server running indefinitely


async def main(use_virtual_port=False):
    serial_connection = find_arduino_port()

    # Start WebSocket server in a background task
    websocket_task = asyncio.create_task(start_websocket_server(serial_connection, use_virtual_port))

    try:
        # Loop to detect disconnection and attempt reconnection
        while True:
            if (not serial_connection or not serial_connection.is_open) and not use_virtual_port:
                logger.info("Serial device disconnected. Retrying in 5 seconds...")
                await asyncio.sleep(5)
                serial_connection = find_arduino_port()

                # Restart the WebSocket server if reconnected
                if serial_connection and serial_connection.is_open:
                    websocket_task.cancel()  # Cancel the existing WebSocket task
                    websocket_task = asyncio.create_task(start_websocket_server(serial_connection))
            await asyncio.sleep(1)  # Avoid busy-waiting
    except asyncio.CancelledError:
        logger.info("Server stopped.")
    except KeyboardInterrupt:
        logger.info("Server interrupted.")


# Run the main function
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.error("Server stopped.")
