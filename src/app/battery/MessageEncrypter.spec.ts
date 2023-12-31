import { MessageEncryptor } from "./MessageEncrypter";

describe("MessageEncrypter", function() {
  it("ctor invalid battery description", function() {
    expect(() => new MessageEncryptor('12345678')).toThrowError('Passed battery description (\'12345678\') has wrong format! Expected are the battery type (either \'A\' or \'B\') and 5 digits for the serial number. Might be prepended by \'SmartBat-\'');
  });

  it("ctor unknown battery type", function() {
    expect(() => new MessageEncryptor('C12345')).toThrowError('Passed battery description (\'C12345\') has wrong format! Unknown battery type \'C\' (allowed are \'A\' or \'B\')');
  });

  it("ctor unknown battery type", function() {
    expect(() => new MessageEncryptor('A12A45')).toThrowError('Passed battery description (\'A12A45\') has wrong format! Invalid serial number.');
  });

  it("ctor valid battery description", function() {
    var msgEncryptor = new MessageEncryptor('A12345');

    expect(msgEncryptor.batteryTypeSerial).toBe('A12345');
  });

  it("ctor valid battery dexcription with prefix", function() {
    var msgEncryptor = new MessageEncryptor('SmartBat-A12345');

    expect(msgEncryptor.batteryTypeSerial).toBe('A12345');
  });
});
