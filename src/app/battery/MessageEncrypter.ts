export class MessageEncryptor {
  private _magicNumbers: Array<number> = [2, 5, 4, 3, 1, 4, 1, 6, 8, 3, 7, 2, 5, 8, 9, 3];

  batteryTypeSerial: string = '';
  encryptionCode: number = 0x00;

  constructor(batteryDescription: string) {
    if (batteryDescription.includes('SmartBat-')) {
      this.batteryTypeSerial = batteryDescription.split('-')[1];
    }
    else {
      this.batteryTypeSerial = batteryDescription;
    }

    if (this.batteryTypeSerial.length != 6) {
      throw new Error('Passed battery description (\'' + batteryDescription + '\') has wrong format! Expected are the battery type (either \'A\' or \'B\') and 5 digits for the serial number. Might be prepended by \'SmartBat-\'');
    }

    if (this.batteryTypeSerial.charAt(0) != 'A' && this.batteryTypeSerial.charAt(0) != 'B') {
      throw new Error('Passed battery description (\'' + batteryDescription + '\') has wrong format! Unknown battery type \'' + this.batteryTypeSerial.charAt(0) + '\' (allowed are \'A\' or \'B\')');
    }

    var batterySerialNumberString: string = this.batteryTypeSerial.substring(1, 6);

    if (!Number(batterySerialNumberString)) {
      throw new Error('Passed battery description (\'' + batteryDescription + '\') has wrong format! Invalid serial number.');
    }

    var batterySerialNumber = Number(batterySerialNumberString);
  }
}
