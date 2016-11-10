Track board:
The track board is a stateless system component that has the following functions:
1. Acting as a transparent communication link between car and server.
2. Sending continuous Track identity (TID) packets every ### ms
3. Sending a lap event packet (LAP) every time a car passes over the finish line
   IR sensor.

Car:
Has two states; IDLE while in low voltage mode and RACING when in high voltage
mode. The car sends information on both the PLC channel and the WiFi/Bluetooth.
During IDLE state it has the following functions:
1. Sending continuous Car identity (CID) packets every ### ms over the PLC
2. Sending Telemetry data over WiFi every ~50 ms
During RACE state it has the following functions:
1. Run the feedback loop and race around the track.
2. Listen to incomming communication on the PLC, instead of continuously sending
   CID packets.
3. Sending Telemetry data over WiFi every ~50 ms
The state will change between the IDLE/RACING state when the car registers
changes in the voltage level, LOW(+6V) and HIGH(+12V).

ESP8266:
Acts as a transparent communication channel sending serial data over websockets.
Mainly sending telemetry data to the Carduino Server.
1. Try to connect to the preprogrammed AP with stored credentials. If it fails
   to connect it will switch into AP mode and one has to connect and configure
   the AP to use.
2. Connect websocket to host carduino-master.local:80
3. Send incomming serial data transparently over the websocket to the
   Carduino server.

PSU:
Feeds power to the tracks. Managed from the Carduino server

Carduino Server:
Managing all the system components, based on Raspberry Pi 3 hardware.
Controlls the state of the system, initializing, starting/stoping and reseting the
system components.
