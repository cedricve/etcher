/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const _ = require('lodash');

module.exports = function(ModalService, $uibModalInstance, KiOSModel, SelectionStateModel) {

  let networkModal = null;

  this.networkType = {
    // Eth or WiFI
    'type': undefined,
    'connection': undefined,
    'password': undefined,
  };

  this.networkConfiguration = {
    // Dynamic or Static
    'configuration': undefined,
    'ip': undefined,
    'netmask': undefined,
    'gateway': undefined,
    'dns': undefined,
  };

  this.release = undefined;
  this.type = undefined;
  this.configuration = undefined;
  this.wifi_connection = undefined;
  this.wifi_password = undefined;

  /**
   * @summary The drive selector state
   * @property
   * @type Object
   */
  this.state = SelectionStateModel;

  /**
   * @summary The drives model
   * @property
   * @type Object
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `DrivesModel` detects a change in the drives.
   */
  this.kios = KiOSModel;

  this.showDevices = (release) => {
    this.release = release;

    var boardMapping = [];
    boardMapping['raspberrypi'] = 'Raspberry Pi A, B or Zero';
    boardMapping['raspberrypi2'] = 'Raspberry Pi 2';
    boardMapping['raspberrypi3'] = 'Raspberry Pi 3';

    var assets = _.map(release.assets, function(element) { 
     return _.extend({}, element, {
        tag_name: release.tag_name,
        board: (boardMapping[element.name.split('-')[1]]) ? boardMapping[element.name.split('-')[1]] : element.name.split('-')[1]
      });
    });
    this.devices = assets;
  };

  this.getDevices = () => {
    return this.devices;
  };

  this.setNetworkType = (type) => {

    this.kios.type = type;

    if(type)
    {
      this.networkType['type'] = type.value;
    }
    else
    {
      this.networkType['type'] = undefined;
    }
    this.setNetworkTypeState();
  };

  this.setConnection = (connection) => {
    this.kios.connection = connection;

    if(connection)
    {
      this.wifi_connection = connection.ssid;
      this.networkType['connection'] = (connection.ssid == "? not in this list") ? 'other' : connection.ssid;
    }
    else
    {
      this.wifi_connection = undefined;
      this.networkType['connection'] = undefined;
    }

    this.setNetworkTypeState();
  }

  this.setNetworkConfiguration = (configuration) => {

    this.kios.config = configuration;

    if(configuration)
    {
      this.networkConfiguration['configuration'] = configuration.value;
    }
    else
    {
      this.networkConfiguration['configuration'] = undefined;
    }
    this.setNetworkConfigurationState();
  } 

  // Push to state object
  this.setNetworkTypeState = () => {

    if(this.kios.type)
    {
      this.networkType['type'] = this.kios.type.value;
      if(this.kios.type.value == 'wifi')
      {
        if(this.kios.wifi_connection)
        {
          this.networkType['connection'] = this.kios.wifi_connection;
        }
        else if (this.kios.connection)
        {
          this.networkType['connection'] = this.kios.connection.ssid;
        }

        this.networkType['password'] = this.kios.wifi_password;
      }
    }

    this.state.setNetworkTypeState(this.networkType);
  }

  this.setNetworkConfigurationState = () => {
    this.networkConfiguration['ip'] = this.kios.ip;
    this.networkConfiguration['netmask'] = this.kios.netmask;
    this.networkConfiguration['gateway'] = this.kios.gateway;
    this.networkConfiguration['dns'] = this.kios.dns;
    if(this.kios.config)
    {
      this.networkConfiguration['configuration'] = this.kios.config.value;
    }
    this.state.setNetworkConfigurationState(this.networkConfiguration);
  }

  /**
   * @summary Close the modal and resolve the selected drive
   * @function
   * @public
   *
   * @example
   * DriveSelectorController.closeModal();
   */
  this.networkModal = () => {

    $uibModalInstance.close();
    
    networkModal = ModalService.open({
      template: './components/kios-selector/templates/specify-network-modal.tpl.html',
      controller: 'KiOSSelectorController as modal',
    });

    return networkModal.result;
  };

  this.networkConfigModal = () => {

    $uibModalInstance.close();

    this.kios.initalizeConfiguration();
    
    networkModal = ModalService.open({
      template: './components/kios-selector/templates/specify-network-config-modal.tpl.html',
      controller: 'KiOSSelectorController as modal',
    });

    return networkModal.result;
  };

  /**
   * @summary Close the modal and resolve the selected drive
   * @function
   * @public
   *
   * @example
   * DriveSelectorController.closeModal();
   */
  this.closeModal = () => {

    const selectedDrive = SelectionStateModel.getDrive();

    // Sanity check to cover the case where a drive is selected,
    // the drive is then unplugged from the computer and the modal
    // is resolved with a non-existent drive.
    if (!selectedDrive || !_.includes(this.kios.getDrives(), selectedDrive)) {

      $uibModalInstance.close();

    } else {
      $uibModalInstance.close(selectedDrive);
    }

  };


  this.initialize = () => {

    if(this.kios.release)
    {
      this.showDevices(this.kios.release)
      this.setNetworkConfigurationState();
      this.setNetworkTypeState();
    }
  };
  
  this.initialize();

};
