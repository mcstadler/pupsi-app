/// <reference types="web-bluetooth" />
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'pupsi-app';

  commands: String[] = [
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

    navigator.bluetooth.requestDevice({
      filters: [{
        services: [0xfff0],
      }]
    }).then((device: BluetoothDevice) => console.log(device));
  }

  sendCommand(command: String) {
    console.log("Send command", command);
  }
}
