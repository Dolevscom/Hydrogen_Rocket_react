#!/bin/bash

# Redirect output to a log file for debugging
exec >> /home/mada/Desktop/Hydrogen_Rocket/startup.log 2>&1

# Add Poetry to PATH
export PATH="/home/mada/.local/bin:$PATH"

# Kill existing processes on ports 3000 and 9001
echo "$(date): Killing processes on ports 3000 and 9001..."
fuser -k 3000/tcp
fuser -k 9001/tcp

# Kill any existing serial_to_websocket.py processes
echo "$(date): Killing existing serial_to_websocket.py processes..."
pkill -f "serial_to_websocket.py" || echo "No existing serial_to_websocket.py processes found."

# Activate virtual environment
echo "$(date): Activating virtual environment..."
source /home/mada/Desktop/Hydrogen_Rocket/my_env/bin/activate

# Start the Python WebSocket server
echo "$(date): Starting serial_to_websocket.py..."
python /home/mada/Desktop/Hydrogen_Rocket/serial_to_websocket/serial_to_websocket.py &
echo "$(date): serial_to_websocket.py is running in the background."

# Wait briefly to ensure Python script starts
sleep 2

# Start the React app
echo "$(date): Starting the React app..."
cd /home/mada/Desktop/Hydrogen_Rocket/hydrogen-rocket-ui
npm start &

# Wait for React app to start
sleep 10

# Close opened windows in firefox and wait 3 seconds and open the app in a browser in kiosk mode (full-screen)
echo "$(date): Opening app in browser..."
pkill firefox-bin
sleep 3
firefox --kiosk http://localhost:3000 &

# # Simulate F11 to toggle full screen (if needed)
# if command -v xdotool &> /dev/null; then
#     echo "$(date): Simulating F11 for full screen..."
#     xdotool search --sync --onlyvisible --class firefox key F11
# else
#     echo "$(date): xdotool not installed. Skipping F11 simulation."
# fi

echo "$(date): Script completed."
