# Serial To WebSocket Forwarder
This is a simple Python script that forwards data from a serial port to a WebSocket server. 
It is used throughout the Energy Exhibition project to forward data from the Arduino 
boards to the React frontend.

## Installation
Install the required packages using poetry:
    ```bash
    poetry install
    ```
    If you don't have poetry installed, you can install it using pip:
    ```bash
    pip install poetry
    ```
    Or you can install the required packages using pip:
    ```bash
    pip install websockets pyserial
    ```
## Usage
Run the script:
    ```bash
    poetry run python serial_to_websocket.py
    ```
    Or if you installed the required packages using pip:
    ```bash
    python serial_to_websocket.py
    ```
The script will serve the WebSocket server on `ws://localhost:9001` 
and will forward the data from the serial port to the WebSocket server.