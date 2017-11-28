var mqttClient = require('./awsiot.js');

var ledChart = {};
var motionChart = {};
var tempChart = {};
var dataChart = {};
var ledStatus;
var endpoint = "https://3v5mhdfdne.execute-api.us-west-2.amazonaws.com/prod";

// Subscribe to topics
window.mqttClientConnectHandler = function() {
	console.log('connect');
	mqttClient.subscribe("sensor/camera/image");
	mqttClient.subscribe("sensor/led/payload");
	mqttClient.subscribe("sensor/motion/payload");
	mqttClient.subscribe("sensor/temperature/payload");
};

// Respond to subscribed topics when they are published to
window.mqttClientMessageHandler = function(topic, payload) {
	var message = 'message: ' + topic + ':' + payload.toString();
	console.log(message);
	var payloadObj = JSON.parse(payload);

	if (topic == "sensor/camera/image") {
		document.getElementById("cameraImage").src = payloadObj["url"];
	}
	if (topic == "sensor/led/payload") {
		ledStatus = payloadObj["status"];
		var dataLength = ledChart.chart.data.datasets[0].data.length;
		ledChart.chart.data.datasets[0].data[dataLength] = payloadObj["status"];
		ledChart.chart.data.labels[dataLength] = payloadObj["timeStampIso"];
		ledChart.chart.update();
		setLedButtonStatus(payloadObj["status"]);
		var ledText = document.getElementById("ledStatus");
		ledText.innerHTML = setupSensorText(payloadObj["status"], payloadObj["timeStampIso"]);
	}
	if (topic == "sensor/motion/payload") {
		var dataLength = motionChart.chart.data.datasets[0].data.length;
		motionChart.chart.data.datasets[0].data[dataLength] = payloadObj["status"];
		motionChart.chart.data.labels[dataLength] = payloadObj["timeStampIso"];
		motionChart.chart.update();
		var motionText = document.getElementById("motionStatus");
		motionText.innerHTML = setupSensorText(payloadObj["status"], payloadObj["timeStampIso"]);
	}
	if (topic == "sensor/temperature/payload") {
		var dataLength = tempChart.chart.data.datasets[0].data.length;
		tempChart.chart.data.datasets[0].data[dataLength] = payloadObj["status"];
		tempChart.chart.data.labels[dataLength] = payloadObj["timeStampIso"];
		tempChart.chart.update();
		var tempText = document.getElementById("tempStatus");
		tempText.innerHTML = setupSensorText(payloadObj["status"], payloadObj["timeStampIso"]);

	}
};

mqttClient.on('connect', window.mqttClientConnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);

window.onload = function() {
	setDefaultTimeRange();
	setupCurrSensorStatus();
}

function setupCurrSensorStatus() {
	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", endpoint + "/currstatus");

	xhttp.onload = function(e) {
		if (this.status != 200) {
			console.error("Error getting current sensor status");
			return;
		}

		var sensorStatus = JSON.parse(xhttp.response)["Items"];

		var ledText = document.getElementById("ledStatus");
		var motionText = document.getElementById("motionStatus");
		var tempText = document.getElementById("tempStatus");

		for (var i = 0; i < sensorStatus.length; i++) {
			var text = setupSensorText(sensorStatus[i].payload.status, sensorStatus[i].payload.timeStampIso);
			var timeStampIso = new Date().toISOString();
			if (sensorStatus[i].sensorId == "led") {
				ledText.innerHTML = text;
				ledStatus = sensorStatus[i].payload.status;
				setLedButtonStatus(sensorStatus[i].payload.status);
				createChart("led", document.getElementById('ledChart').getContext('2d'), ledChart, 
					[sensorStatus[i].payload.status], [timeStampIso]);
			}
			if (sensorStatus[i].sensorId == "motion") {
				motionText.innerHTML = text;
				createChart("motion", document.getElementById('motionChart').getContext('2d'), motionChart, 
					[sensorStatus[i].payload.status], [timeStampIso]);
			}
			if (sensorStatus[i].sensorId == "temperature") {
				tempText.innerHTML = text;
				createChart("temperature", document.getElementById('tempChart').getContext('2d'), tempChart, 
					[sensorStatus[i].payload.status], [timeStampIso]);
			}
		}
	}

	xhttp.send();
}

function setupSensorData(sensor, sensorCtx, sensorChart, timeStart, timeEnd) {
	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", endpoint + "/status/" + sensor + "?timestart=" + timeStart + "&timeEnd=" + timeEnd);

	xhttp.onload = function(e) {
		if (this.status != 200) {
			console.error("Error getting sensor data");
			return;
		}

		var responseData = JSON.parse(xhttp.response)["Items"];
		console.log(data)

		var timeStamps = [];
		var data = [];

		for (var i = 0; i < responseData.length; i++) {
			timeStamps.push(responseData[i].payload["timeStampIso"]);
			data.push(responseData[i].payload["status"]);
		}

		console.log(timeStamps);
		console.log(data);

		createChart(sensor, sensorCtx, sensorChart, data, timeStamps);
	}

	xhttp.send();
}

function createChart(sensor, sensorCtx, sensorChart, data, timeStamps) {
	sensorChart.chart = new Chart(sensorCtx, {
		type: 'line',
		data: {
			labels: timeStamps,
			datasets: [{
				label: sensor + " Status",
				data: data,
				steppedLine: true,
				backgroundColor: "rgba(153,255,51,0.4)"
			}]
		},
		options: {
			scales: {
				xAxes: [{
					type: 'time',
				}]
			}
		}
	});
}

function setupSensorText(status, time) {
	return status + ". Updated on " + time;
}

function setLedButtonStatus(newStatus) {
	var ledButton = document.getElementById("ledButton");
	ledButton.innerHTML = newStatus == "1" ? "Turn LED Off" : "Turn LED On";
}

function setDefaultTimeRange() {
	var timeStart = document.getElementById("timeStart");
	var timeEnd = document.getElementById("timeEnd");

	var time = new Date().getTime();
	timeEnd.value = parseInt(time);
	timeStart.value = parseInt(time) - 1000 * 3600; 
}

window.onLedButtonClick = function() {
	var xhttp = new XMLHttpRequest();
	xhttp.open("PUT", endpoint + "/setstatus/led");

	xhttp.onload = function(e) {
		console.log(xhttp.response);
	}

	var newStatus = ledStatus == "1" ? "0" : "1";

	xhttp.send(JSON.stringify({ "status": newStatus }));
}

window.onCameraButtonClick = function() {
	var xhttp = new XMLHttpRequest();
	xhttp.open("PUT", endpoint + "/takepicture");

	xhttp.onload = function(e) {
		console.log(xhttp.response);
	}

	xhttp.send();
}

window.onGraphButtonClick = function() {
	var sensorSelect = document.getElementById("sensorSelect");
	var timeStart = document.getElementById("timeStart");
	var timeEnd = document.getElementById("timeEnd");

	if (parseInt(timeStart.value) > parseInt(timeEnd.value)) {
		alert("Time Start cannot be lower than Time End");
		return;
	}

	setupSensorData(sensorSelect.value, document.getElementById('dataChart').getContext('2d'), dataChart, timeStart.value, timeEnd.value);
}