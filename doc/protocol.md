The serial protocol is inspired by the GPIB protocol style.
All datagrams follow this template:

<cmd>:<value1>:<value2>...:<valuen><CRLF>

All ASCII chars except ':' can be used in this protocol

These are the current available datagrams:

1. Car Identity
	Sent by the car to the server, informing the server about car identity
	FORMAT:
	<cmd> = CID
	<value1> = car identification number (integer)
	<value2> = programmer name (string)
	<value3> = program revision (integer)
	ex. 'CID:23:test@example.com:7'

2. Track Identity
	Sent by the track to the server, informing server about track number
	FORMAT:
	<cmd> = TID
	<value1> = track number (integer)
	ex. 'TID:2'

3. Lap event
	Sent by the track to the server, informing that the car has passed the
	checkpoint.
	FORMAT:
	<cmd> = LAP
	<value1> = track number (integer)
	ex. 'LAP:2'

An exception to this protocol is the telemetry protocol, which has a slightly more
dense form:

#<carid>T<timestamp>F<frontencoder>R<rearencoder>X<acc_x>Y<acc_y>Z<acc_z>U<gyro_u>V<gyro_v>W<gyro_w>I<current>S<speed>!

It starts with character '#' and ends with '!', the values may only contain integers
with ASCII characters '0'-'9'.
