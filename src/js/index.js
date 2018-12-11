// JavaScript SDK Demo App
// Copyright 2018 Optimizely. Licensed under the Apache License
/* globals $ location */

import OptimizelyManager from './optimizely_manager';
import { getCookie } from './audience';

const _ = require('underscore');

async function main () {
  const optimizelyClientInstance = await OptimizelyManager.createInstance();
  window.optimizelyClientInstance = optimizelyClientInstance;

  $(document).ready(function () {
    _buildItems()
      .then(_renderItemsTable)
      .then(function (tableHTML) {
        $('#items-table').html(tableHTML);
      });

    $('#input-name-button').on('click', function () {
      const userID = $('#input-name').val();
      if (!userID) {
        return;
      }
      shop(userID);
    });
  });

  function shop (userID) {
    // Step 1: Set Attribute Values
    // Step 2: Pass attributes through to .isFeatureEnabled()
    // Step 3: Pass attributes through to .getFeatureVariableString()
    // Step 4: Pass attributes through to .track()

    /* Set Attribute Values */
    let bbCookie = getCookie('bbCookie');
    let browserType = window.WURFL.complete_device_name;
    let queryParam = location.search.substr(location.search.indexOf('test=') + 5);

    let attributes = {
      bbCookie,
      browser_type: browserType,
      query_param: queryParam
    };
    /* End Attribute Values */

    // retrieve Feature Flag
    const isSortingEnabled = optimizelyClientInstance.isFeatureEnabled(
      'sorting_enabled',
      userID,
      attributes
    );

    // retrieve welcome message stored as a feature variable
    const welcomeMessage = optimizelyClientInstance.getFeatureVariableString(
      'sorting_enabled',
      'welcome_message',
      userID,
      attributes
    );

    // display feature if enabled
    if (isSortingEnabled) {
      _renderSortingDropdown();
    } else {
    // ensure feature is disabled
      $('#sorting > span').remove();
    }

    if (welcomeMessage) {
      $('#welcome').html(welcomeMessage);
    } else {
      // Set a default message
      $('#welcome').html('Welcome to Attic & Button');
    }

    // update UI to display if Feature Flag is enabled
    const indicatorBool = (isSortingEnabled) ? 'ON' : 'OFF';
    const indicatorMessage = `[Feature ${indicatorBool}] The feature "sorting_enabled" is ${indicatorBool} for user ${userID}`;
    $('#feature-indicator').html(indicatorMessage);
  }

  function buy () {
    const userID = $('#input-name').val();
    let bbCookie = getCookie('bbCookie');
    let browserType = window.WURFL.complete_device_name;
    optimizelyClientInstance.track(
      'item_purchase',
      userID,
      {
        bbCookie,
        browser_type: browserType
      }
    );
    window.location.href = '/purchase.html';
  }

  window.buy = buy;
}

async function _buildItems () {
  let items = [];

  await $.ajax({
    url: './items.csv',
    dataType: 'text',
    success: function (data) {
      let itemLines = data.split('\n');
      for (var i = 0; i < itemLines.length; i++) {
        let item = itemLines[i].split(',');
        items.push({
          name: item[0],
          color: item[1],
          category: item[2],
          price: parseInt(item[3].slice(1)),
          imageUrl: item[4]
        });
      }
    }
  });

  return items;
}

function _renderItemsTable (items) {
  let table = document.createElement('table');
  let i = 0;
  while (typeof items[i] !== 'undefined') {
    let row = table.insertRow(-1);
    for (var c = 0; c < 3; c++) {
      let cell = row.insertCell(-1);
      let cellContent = document.createElement('div');
      cellContent.innerHTML = items[i].name;
      cellContent.innerHTML += ' in ' + items[i].color + '<br>';
      cellContent.innerHTML += '<b>' + items[i].category + ', $' + items[i].price + '</b>';
      cellContent.innerHTML += '<img src="./images/' + items[i].imageUrl + '" >';
      cellContent.innerHTML += '<button id="buy-button" onClick="buy()" class="red-button">Buy Now</button>';
      cell.appendChild(cellContent);
      i += 1;
    }
  }
  return table;
}

function _renderSortingDropdown () {
  const selectTitle = document.createElement('span');
  selectTitle.innerHTML += 'Sort Items By: ';
  const selectTypes = document.createElement('select');
  selectTypes.setAttribute('id', 'sorting_type');
  selectTypes.innerHTML += '<option disabled selected value></option>';
  selectTypes.innerHTML += '<option value="price">Price</option>';
  selectTypes.innerHTML += '<option value="category">Category</option>';
  selectTitle.appendChild(selectTypes);
  $('#sorting').html(selectTitle);
  $('#sorting').on('change', function () {
    var sortType = $('#sorting_type option:selected').val();
    _buildItems()
      .then(function (items) {
        items = _.sortBy(items, sortType);
        return _renderItemsTable(items);
      })
      .then(function (tableHTML) {
        $('#items-table').html(tableHTML);
      });
  });
}

main();
