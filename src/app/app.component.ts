/// <reference types="web-bluetooth" />
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'pupsi-app';
  status: any = '';
  events: string = '';
  readCharacteristic!: BluetoothRemoteGATTCharacteristic;
  writeCharacteristic!: BluetoothRemoteGATTCharacteristic;
  infoCharacteristic!: BluetoothRemoteGATTCharacteristic;

  commands: string[] = [
    "+RAA0202",
    "+RAA0A03",
    "+RAA0802",
    "+RAA2C02",
    "+RAA1002",
    "+RAA1002",
    "+RAA0A03",
    "+RAA0802",
    "+RAA0C02",
    "+RAA0403",
    "+RAA3C03",
    "+RAA0603",
    "+RAA1802",
    "+RAA1A02",
    "+RAA2802",
    "+RAA4802",
    "+RAA0202",
  ]

  connectBattery() {
    console.log("Connecting battery");
    this.status = "Connecting..."
    this.events = 'connecting...';

    navigator.bluetooth.requestDevice({
      filters: [{
        services: [0xfff0],
      }],
      optionalServices: [0x1800]
    }).then((device: BluetoothDevice) => {
      console.log(device);
      this.status = 'Device: ' + device;
      device.gatt?.connect()
      .then((server: BluetoothRemoteGATTServer) => {
        console.log(server);
        this.status = 'Server: ' + server;

        server.getPrimaryService(0xfff0)
        .then((service: BluetoothRemoteGATTService) => {
          this.status = 'Service: ' + service;

          service.getCharacteristic(0xfff4)
          .then((characteristic: BluetoothRemoteGATTCharacteristic) => {
            this.status = 'Characteristic: ' + characteristic;
            this.events += '\nRead char: ' + characteristic.uuid;
            this.readCharacteristic = characteristic;
          })
          .catch(reason => this.events += '\nread char error: ' + reason)

          service.getCharacteristic(0xfff6)
          .then((writeCharacteristic: BluetoothRemoteGATTCharacteristic) => {
            this.events += '\nWrite char: ' + writeCharacteristic.uuid;
            this.writeCharacteristic = writeCharacteristic;
          })
        })

        server.getPrimaryService(0x1800)
          .then((service: BluetoothRemoteGATTService) => {
            service.getCharacteristic(0x2A00)
            .then((deviceCharacteristic: BluetoothRemoteGATTCharacteristic) => {
              this.events += '\nDevice char: ' + deviceCharacteristic.uuid;
              this.infoCharacteristic = deviceCharacteristic;
            })
          }).catch(reason => this.events += '\nDevice char err: ' + reason)
      })
      .catch(reason => this.status = reason)
    })
    .catch(reason => this.status = reason);
  }

  readCharacteristicFn() {
    try
    {
      this.events += '\nStart notification...';
      this.readCharacteristic.startNotifications()
        .then(_ => this.events += '\nNotif started')
        .catch(reason => this.events += '\nNotif error: ' + reason);

      this.events += '\nAdd event listener...';
      // Set up event listener for when characteristic value changes.
      this.readCharacteristic.addEventListener(
        'characteristicvaluechanged',
        async (event) => {
          const targetChar = event.target as BluetoothRemoteGATTCharacteristic;

          this.events += '\nTarget char: ' + targetChar.uuid;
          this.events += '\nTarget char value: ' + targetChar.value?.buffer;
          const buffervalue = targetChar.value?.buffer;

          if(buffervalue != null)
          {
              const dataBuff: Uint8Array = new Uint8Array(buffervalue);
              this.events += '\nRaw: ' + dataBuff;
              const encoded: Uint8Array = new Uint8Array(dataBuff.length)
              for (let i = 0; i < dataBuff.length; i++)
              {
                encoded[i] = dataBuff[i] ^ 0x15;
              }
              this.events += '\nData: ' + new TextDecoder().decode(encoded)
            }
        });

      this.events += '\ndone';
    }
    catch (error)
    {
      this.events += '\nCatch: ' + error;
    }
  }

  infoCharacteristicFn() {
    this.infoCharacteristic.readValue()
      .then((data: DataView) => this.events += '\nDeviceName: ' + new TextDecoder().decode(data.buffer))
      .catch(reason => this.events += '\nDeviceName err: ' + reason)
  }

  eventHandler(event: Event) {
    this.events += '\nEvent: ' + event;
  }

  sendCommand(command: string) {
    console.log("Send command", command);

    const encCommand = new TextEncoder().encode(command);
    this.events += '\nEncoded ' + encCommand;

    const encodedCommand: Uint8Array = new Uint8Array(command.length);
    for (let i = 0; i < command.length; i++)
    {
      encodedCommand[i] = encCommand[i] ^ 0x15;
    }
    this.events += '\nXor ' + encodedCommand;
    this.writeCharacteristic.writeValue(encodedCommand)
      .then(_ => this.events += '\nCommand sent!')
      .catch(error => this.events += '\n' + error);
  }
}
