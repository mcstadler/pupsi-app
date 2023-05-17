/// <reference types="web-bluetooth" />
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'pupsi-app';
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
    "+RAA0C02",
    "+RAA0403",
    "+RAA3C03",
    "+RAA0603",
    "+RAA1802",
    "+RAA1A02",
    "+RAA4802",
  ]

  connectBattery() {
    this.events = 'connecting...';

    navigator.bluetooth.requestDevice({
      filters: [{
        services: [0xfff0],
      }],
      optionalServices: [0x1800]
    }).then((device: BluetoothDevice) => {
      console.log(device);
      device.gatt?.connect()
      .then((server: BluetoothRemoteGATTServer) => {
        console.log(server);

        server.getPrimaryService(0xfff0)
        .then((service: BluetoothRemoteGATTService) => {

          service.getCharacteristic(0xfff4)
          .then((characteristic: BluetoothRemoteGATTCharacteristic) => {
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
      .catch(reason => this.events += '\Server err: ' + reason)
    })
    .catch(reason => this.events += '\nDevice err: ' + reason);
  }

  readCharacteristicFn() {
    try
    {
      //this.events += '\nStart notification...';
      this.readCharacteristic.startNotifications()
        //.then(_ => this.events += '\nNotif started')
        .catch(reason => this.events += '\nNotif error: ' + reason);

      this.events += '\nAdd event listener...';
      // Set up event listener for when characteristic value changes.
      this.readCharacteristic.addEventListener(
        'characteristicvaluechanged',
        async (event) => this.eventHandler(event));

      this.events += '\ndone';
    }
    catch (error)
    {
      this.events += '\nCatch: ' + error;
    }
  }

  async eventHandler(event: any) {
    const targetChar = event.target as BluetoothRemoteGATTCharacteristic;

    //this.events += '\nTarget char: ' + targetChar.uuid;
    //this.events += '\nTarget char value: ' + targetChar.value?.buffer;
    const buffervalue = targetChar.value?.buffer;
    if(buffervalue == null)
    {
      this.events += '\nNo data!'
      return
    }

    const dataBuff: Uint8Array = new Uint8Array(buffervalue);
    //this.events += '\nRaw: ' + dataBuff;
    const encoded: Uint8Array = new Uint8Array(dataBuff.length)
    for (let i = 0; i < dataBuff.length; i++)
    {
      encoded[i] = dataBuff[i] ^ 0x15;
    }
    const decodedText = new TextDecoder().decode(encoded);
    this.events += '\nDecoded: ' + decodedText

    var voltageVal = 0;

    switch(decodedText.substring(0, 6)) {
      // SOC (battery level)
      case "+RD,02":
        const hexBattLevel = decodedText.substring(6,8);
        const battLevel = parseInt(hexBattLevel, 16);
        this.events += '\nBattery level: ' + battLevel + '%'
        break;

      // RMC
      case "+RD,04":
        const hexRatio = decodedText.substring(10,12);
        const ratio = parseInt(hexRatio, 16);
        this.events += '\nRatio: ' + ratio

        const hexRmcLsb = decodedText.substring(6,8);
        const hexRmcMsb = decodedText.substring(8,10);
        const rmcVal = parseInt(hexRmcMsb + hexRmcLsb, 16) * ratio;
        this.events += '\nRMC: ' + rmcVal / 1000 + ' Ah -> ' + rmcVal / 1000 * voltageVal + ' Wh'
        break;

      // ACTION_FCC
      case "+RD,06":
        const hexRatioFfc = decodedText.substring(10,12);
        const ratioFfc = parseInt(hexRatioFfc, 16);
        this.events += '\nRatio: ' + ratioFfc

        const hexActionFfcLsb = decodedText.substring(6,8);
        const hexActionFfcMsb = decodedText.substring(8,10);
        const actionFfcVal = parseInt(hexActionFfcMsb + hexActionFfcLsb, 16) * ratioFfc;
        this.events += '\nAction FFC: ' + actionFfcVal / 1000 + ' Ah'
        break;

      // VOLTAGE
      case "+RD,08":
        const hexVoltageLsb = decodedText.substring(6,8);
        const hexVoltageMsb = decodedText.substring(8,10);
        voltageVal = parseInt(hexVoltageMsb + hexVoltageLsb, 16) / 1000;
        this.events += '\nVoltage: ' + voltageVal + ' V'
        break;

      // TEMPERATURE
      case "+RD,0C":
        const hexTempLsb = decodedText.substring(6,8);
        const hexTempMsb = decodedText.substring(8,10);
        const tempVal = (parseInt(hexTempMsb + hexTempLsb, 16) - 2731) / 10;
        this.events += '\nTemperature: ' + tempVal + ' °C'
        break;

      // CURRENT
      case "+RD,10":
        const hexCurrLsb = decodedText.substring(6,8);
        const hexCurrMsb = decodedText.substring(8,10);
        const currVal = parseInt(hexCurrMsb + hexCurrLsb, 16) / 1000;
        this.events += '\nCurrent: ' + currVal + ' A'
        break;

      // ACTION_ATTE
      case "+RD,18":
        const hexAtteLsb = decodedText.substring(6,8);
        const hexAtteMsb = decodedText.substring(8,10);
        const atteVal = parseInt(hexAtteMsb + hexAtteLsb, 16) / 60;
        this.events += '\nTime until 0% SOC: ' + atteVal + ' h'
        break;

      // ACTION_ATTF
      case "+RD,1A":
        const hexAttfLsb = decodedText.substring(6,8);
        const hexAttfMsb = decodedText.substring(8,10);
        const attfVal = parseInt(hexAttfMsb + hexAttfLsb, 16) / 60;
        this.events += '\nTime until 100% SOC: ' + attfVal + ' h'
        break;

      // ACTION_NUMBER
      case "+RD,28":
        const hexSerNoLsb = decodedText.substring(6,8);
        const hexSerNoMsb = decodedText.substring(8,10);
        const serNoVal = parseInt(hexSerNoMsb + hexSerNoLsb, 16);
        this.events += '\nSerial number: ' + serNoVal
        break;

      // CYCLE
      case "+RD,2C":
        const hexCycleLsb = decodedText.substring(6,8);
        const hexCycleMsb = decodedText.substring(8,10);
        const cycleVal = parseInt(hexCycleMsb + hexCycleLsb, 16);
        this.events += '\nCycles: ' + cycleVal
        break;

      // ACTION_DCAP
      case "+RD,3C":
        const hexRatioDcap = decodedText.substring(10,12);
        const ratioDcap = parseInt(hexRatioDcap, 16);
        this.events += '\nRatio: ' + ratioDcap

        const hexActionDcapLsb = decodedText.substring(6,8);
        const hexActionDcapMsb = decodedText.substring(8,10);
        const actionDcapVal = parseInt(hexActionDcapMsb + hexActionDcapLsb, 16) * ratioDcap;
        this.events += '\nAction DCAP: ' + actionDcapVal / 1000 + ' Ah'
        break;

      // ACTION_DATE
      case "+RD,48":
        const hexDateLsb = decodedText.substring(6,8);
        const hexDateMsb = decodedText.substring(8,10);
        const dateVal = parseInt(hexDateMsb + hexDateLsb, 16);
        const year = dateVal / 512 + 1980;
        const month = dateVal % 512 / 32;
        const day = dateVal % 512 % 32;
        this.events += '\nDate: ' + day + '.' + month + '.' + year;
        break;

      default:
        this.events += '\nUnknown command! ' + decodedText
    }
  }

  infoCharacteristicFn() {
    this.infoCharacteristic.readValue()
      .then((data: DataView) => this.events += '\nDeviceName: ' + new TextDecoder().decode(data.buffer))
      .catch(reason => this.events += '\nDeviceName err: ' + reason)
  }

  sendCommand(command: string) {
    const encCommand = new TextEncoder().encode(command);
//    this.events += '\nEncoded ' + encCommand;

    const encodedCommand: Uint8Array = new Uint8Array(command.length);
    for (let i = 0; i < command.length; i++)
    {
      encodedCommand[i] = encCommand[i] ^ 0x15;
    }
//    this.events += '\nXor ' + encodedCommand;
    this.writeCharacteristic.writeValue(encodedCommand)
      .then(_ => this.events += '\nCommand sent!')
      .catch(error => this.events += '\n' + error);
  }
}
