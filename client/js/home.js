define(function() {
  var connectText = document.getElementById("connect-text");
  console.log(connectText);

  var connectButton = document.getElementById("connect-button")
  var disconnectButton = document.getElementById("disconnect-button");

  var connDeviceName = null;
  var connDevice = null;

  var nordicUARTservice = {
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    txCharacteristic: '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // transmit is from the phone's perspective
    rxCharacteristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // receive is from the phone's perspective
  };

  var cxn = {};

  cxn.onValChange = function (event) {
		let value = event.target.value;
    console.log("Received", value)
	};

  function updateDisplayName(name) {
    connDeviceName = name;
    if (connDeviceName === null) {
      connectText.innerHTML = "null";
    } else {
      connectText.innerHTML = connDeviceName;
    }
  }
  updateDisplayName(null);

  function onDisconnectButtonClick() {
    console.log("onDisconnectButtonClick");
    connDevice.gatt.disconnect();
    cxn.webBLEWrite.service.device.gatt.disconnect();
    cxn.webBLERead.service.device.gatt.disconnect();

    // cxn.webBLEWrite = null;
    // cxn.webBLERead = null;
    updateDisplayName(null);
  }

  function onDisconnected() {
    console.log("disconnected");
  }

  function tryConnect() {

    let options = {
      filters: [
        // The GATT filter filters out micro:bits on chrome books (6/1/2019) why??
        // {services: ['generic_attribute']},
        { namePrefix: 'BBC micro:bit' }
      ],
      optionalServices: [nordicUARTservice.serviceUUID, 'link_loss']
    };
    console.log("tryconnect")
    // requestDevice will trigger a browse dialog once back to the browser loop.
    // When a user selects one the 'then()' is called. Since the user has already
    // selected on at that point, add it to the list and select.
    navigator.bluetooth.requestDevice(options)
    .then(function (device) {
      // Called once device selected by user - no connection made yet
      console.log('> device:', device);
      connDevice = device;
      // var beaconInfo = {
      //   name: device.name,     // Should be in 'BBC micro:bit [xxxxx]' format
      //   id: device.id,          // looks like a hast of mac id perhaps
      //   rssi: -1,               // signal strength is not shared with JS code
      //   autoSelect: true        // indicate that the app should now connect.
      // };
      // cxn.beaconReceived(beaconInfo);
      device.addEventListener('gattserverdisconnected', onDisconnected);
      // cxn.setConnectionStatus(beaconInfo.botName, cxn.statusEnum.CONNECTING);
      return device.gatt.connect();
    })
    .then(function (server) {
      // Called once gatt.connect() finishes
      console.log('> GATT connected:', server);
      return server.getPrimaryService(nordicUARTservice.serviceUUID);
    })
    .then(function (primaryService) {
      // Called once nordicUARTservice is found.
      console.log('> Nordic UART service connected:', primaryService);
      // Calling getCharacteristics with no parameters
      // should return the one associated with the primary service
      // ( the tx and rx service)
      return primaryService.getCharacteristics();
    })
    .then(function (characteristics) {
      var rawName = characteristics[0].service.device.name;
      updateDisplayName(rawName);
      console.log('> UART characteristics:', rawName, characteristics);
      // var botName = cxn.bleNameToBotName(rawName);
      // cxn.scanning = false;
      // cxn.setConnectionStatus(botName, cxn.statusEnum.CONNECTED);

      if (characteristics.length >= 2) {
        var c0 = characteristics[0];
        var c1 = characteristics[1];
        if (c0.uuid === nordicUARTservice.txCharacteristic) {
          cxn.webBLEWrite = c0;
        } else if (c1.uuid === nordicUARTservice.txCharacteristic) {
          cxn.webBLEWrite = c1;
        }
        if (c0.uuid === nordicUARTservice.rxCharacteristic) {
          cxn.webBLERead = c0;
        } else if (c1.uuid === nordicUARTservice.rxCharacteristic) {
          cxn.webBLERead = c1;
        }
      }
      cxn.webBLERead.startNotifications()
      .then(function () {
        console.log('adding event listener');
        cxn.webBLERead.addEventListener('characteristicvaluechanged',
        cxn.onValChange);
      });
    })
    .catch(function (error) {
      console.log("error");
      console.log(error);
      // cxn.scanning = false;
      // cxn.connectionChanged(cxn.devices);
      // // User canceled the picker.
      // //console.log('cancel or error :' + error);
    });
  }


  connectButton.onclick = function() {
    console.log("ConnectButton")
    tryConnect();
  };

  disconnectButton.onclick = onDisconnectButtonClick;


});
