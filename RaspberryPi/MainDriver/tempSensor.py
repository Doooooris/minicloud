"""
Remember to start the daemon with the command
'sudo pigpiod' before running this script. It
needs to be restarted every time your pi
is restarted.
"""

import pigpio
import DHT22
import time

# Initiate GPIO for pigpio
pi = pigpio.pi()
# Setup the sensor
dht22 = DHT22.sensor(pi, 12) # use the actual GPIO pin name
dht22.trigger()

# We want our sleep time to be above 2 seconds.
# sleepTime = 5

def readDHT22():
    # Get a new reading
    dht22.trigger()
    # Save our values
    humidity  = '%.2f' % (dht22.humidity())
    temp = '%.2f' % (dht22.temperature())
    return (humidity, temp)

def read_temp_every(sleepTime):
    while True:    
        humidity, temperature = readDHT22()
        print("Humidity is: " + humidity + "%")
        print("Temperature is: " + temperature + "C")
        time.sleep(sleepTime)


#while True:
#    humidity, temperature = readDHT22()
#    print("Humidity is: " + humidity + "%")
#    print("Temperature is: " + temperature + "C")
#    sleep(sleepTime)
