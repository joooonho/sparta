/* globals Chart:false, feather:false */

$(document).ready(function () {
  //$('#stock_row').html('');
  $('#table_price').html('');
  let symbol = $('#stock_symbol').text();

  stock_price(symbol);
  current_price(symbol);
  order_record(symbol);
  //매도 기록 가져오기
  get_sell_record();
  //매도 종합 데이터 가져오기
  get_total_sell_record();
  //매수 종합 데이터 가져오기
  get_total();
  graph();
});


// let stock_info;

//     url = `https://cloud.iexapis.com/stable/stock/${symbol}/company?token=${token}`
//     console.log(url);
//     $.ajax({
//         type: "GET",
//         url: url,
//         async: false,
//         data: {},
//         success: function (response) { // 성공하면
//             show_stock_info(response['industry'], response['website'], response['description'], response['sector']);
//             stock_info = {'industry' : response['industry'], 
//             'website': response['website'], 'description' :  response['description'], 'sector' : response['sector']};
//         }
//     })


function stock_price(symbol) {

  //url = `https://finance.yahoo.com/quote/${symbol}/history?period1=1488412800&period2=1593043200&interval=1d&filter=history&frequency=1d`;
  url = `https://finance.yahoo.com/quote/${symbol}/history?p=${symbol}`;

  $.ajax({
    type: "POST",
    url: "/stock_price",
    data: { url_give: url },
    success: function (response) { // 성공하면

      let temp = response['dictionary'];
      temp.forEach(curr => list_price(curr['date'], curr['open'], curr['close'], curr['low'], curr['high'], curr['volume']));

    }
  })
}

function list_price(date, open, close, low, high, volume) {

  let temp_html = `<tr>
    <td>${date}</td>
    <td>${close}</td>
    <td>${open}</td>
    <td>${high}</td>
    <td>${low}</td>
  </tr>`;

  $('#table_price').append(temp_html);

}

//현재가 구하기
function current_price(symbol) {

  url = `https://finance.yahoo.com/quote/${symbol}/history?period1=1488412800&period2=1593043200&interval=1d&filter=history&frequency=1d`

  $.ajax({
    type: "POST",
    url: "/current_price",
    data: { url_give: url },
    success: function (response) { // 성공하면

      //현재가 구하면서 현재 손익까지 계산함 
      $('#price').empty();
      $('#rate').empty();
      $('#profit').empty();

      let temp = response['price_rate'];

      //get_total_total은 '매수종합'에서 총 매수가
      let cal = $('#get_total_quantity').text() * temp['price'] - $('#get_total_total').text();

      $('#price').append(temp['price']);
      $('#rate').append(temp['rate']);
      $('#profit').append(cal);
    }
  })

  //timer = setTimeout(current_price, 1000, symbol);
}

function calculate() {

  $('#total_price').empty();

  let price = $('#input_price').val();
  let quantity = $('#input_quantity').val();

  $('#total_price').append(price * quantity);

}

//매수/ 매도 주문 
function buy() {

  let symbol = $('#stock_symbol').text();
  let method = $('#buy_sell').val();
  let date = $('#input_date').val();
  let price = $('#input_price').val();
  let quantity = $('#input_quantity').val();
  let total = $('#total_price').text();

  let inputBox = [['method', method], ['date', date], ['price', price], ['quantity', quantity], ['total', total]];
  let i;
  for (i = 0; i < inputBox.length; i++) {

    if (inputBox[i][1] == '') {
      alert(inputBox[i][0] + '을(를) 입력해라');
      return;
    }
  }

  if(method == '매도' && quantity > $('#get_total_quantity').text()) {
    
    $('#total_price').empty();
    alert('매도 수량을 보유 수량보다 작거나 같게 입력해라')
    return;
  }


  $.ajax({
    type: "POST",
    url: "/order",
    data: { symbol_give: symbol, method_give : method, date_give: date, price_give: price, quantity_give: quantity, total_give: total },
    success: function (response) { // 성공하면

      if (response['result'] == 'success')
        alert('주문 완료');
      order_record(symbol);
      current_price(symbol);
      get_sell_record();
      get_total_sell_record ();
    }
  })
}

function order_record(symbol) {

  $.ajax({
    type: "POST",
    url: "/get_order",
    data: { symbol_give: symbol },
    success: function (response) { // 성공하면

      $('#order_record').empty();
      temp = response['orders'];

      // 개별 매수 기록
      temp.forEach(curr => list_orders(curr['_id'], curr['date'], curr['price'], curr['quantity'], curr['total']));

      get_total();
    }
  })
}

//db의 stock total에서 매수 종합 데이터 가져오는 함수
function get_total() {

  let symbol = $('#stock_symbol').text()
  $.ajax({
    type: "POST",
    url: "/get_total",
    async: false,
    data: { symbol_give: symbol },
    success: function (response) { // 성공하면

      $('#stock_total').empty();

      //왜 이것만 리스트로 왔는지 모르겠다.

      temp = response[1]['get_total'];

      //아직 매수종합 데이터가 없을 경우
      if (temp == null)
        return;

      let temp_html = `<tr>
      <td>${temp['price']}</td>
      <td id = "get_total_quantity">${temp['quantity']}</td>
      <td id = "get_total_total">${temp['total']}</td>
      <td id = "profit"></td>
    </tr>`;

      $('#stock_total').append(temp_html);
    }
  })
}

function list_orders(id, date, price, quantity, total) {

  let temp_html = `<tr>
    <td>${date}</td>
    <td>${price}</td>
    <td>${quantity}</td>
    <td>${total}</td>
  </tr>`

  $('#order_record').append(temp_html);

}

//매도 기록 불러오기
function get_sell_record () {
  
  let symbol = $('#stock_symbol').text()

  $.ajax({
    type: "POST",
    url: "/get_sell_record",
    data: { symbol_give: symbol },
    success: function (response) { // 성공하면

      $('#sell_record').empty();
      temp = response['orders'];

      // 개별 매도 기록
      temp.forEach(curr => list_orders_sell( curr['date'], curr['price'], curr['quantity'], curr['total'], curr['profit']));

      //get_total();
    }
  })
}

function list_orders_sell(date, price, quantity, total, profit) {

  let temp_html = `<tr>
    <td>${date}</td>
    <td>${price}</td>
    <td>${quantity}</td>
    <td>${total}</td>
    <td>${profit}</td>
  </tr>`

  $('#sell_record').append(temp_html);
}

//매도 종합 데이터 가져오기
function get_total_sell_record () {

  let symbol = $('#stock_symbol').text()
  
  $.ajax({
    type: "POST",
    url: "/get_total_sell_record",
    data: { symbol_give: symbol },
    success: function (response) { // 성공하면

      $('#stock_total_sell').empty();

      //왜 이것만 리스트로 왔는지 모르겠다.

      temp = response[1]['get_total_sell'];
      console.log(temp);

      //아직 매도종합 데이터가 없을 경우
      if (temp == null)
        return;

      let temp_html = `<tr>
      <td>${temp['quantity']}</td>
      <td>${temp['profit']}</td>
    </tr>`;

      $('#stock_total_sell').append(temp_html);
    }
  })
}

function graph() {
  'use strict'

  feather.replace()

  // Graphs
  var ctx = document.getElementById('myChart')
  // eslint-disable-next-line no-unused-vars
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [
        '선데이',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      datasets: [{
        data: [
          15339,
          21345,
          18483,
          24003,
          23489,
          24092,
          12034
        ],
        lineTension: 0,
        backgroundColor: 'transparent',
        borderColor: '#007bff',
        borderWidth: 4,
        pointBackgroundColor: '#007bff'
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      },
      legend: {
        display: false
      }
    }
  })
}