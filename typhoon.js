var WebSocket = require('websocket').client;
var request = require('request');
var cheerio = require('cheerio');
var CSON = require('cson');
var moment = require('moment-timezone');
var fs = require('fs');

var hostname = 'ws://typhoon.yumetaro.info/websocket';
var ws = new WebSocket();

var currentLength = 0;

var requestRandom = function() {
	var playlist = CSON.parseFileSync('playlist.cson');
	var id = playlist[Math.floor(Math.random() * playlist.length)];

	console.log('[' + moment().tz('Asia/Tokyo').format('LLL') + '] Requesting ' + id);
	request.post({
		url: 'http://typhoon.yumetaro.info/',
		form: {
			url: 'http://www.youtube.com/watch?v=' + id
		}
	}, function(error, response, body) {
		if (error) {
			console.log('[' + moment().tz('Asia/Tokyo').format('LLL') + '] Error: ' + error);
			return;
		}
		$ = cheerio.load(body);
		var alerts = $('div.main > div.alert').text().replace(/(\r\n|\n|\r)/gm, "");
		console.log('[' + moment().tz('Asia/Tokyo').format('LLL') + '] Success(statusCode=' + response.statusCode + '): ' + (alerts ? alerts : 'no alerts'));
	});
};

ws.on('connectFailed', function(error) {
	console.log(error);
});

ws.on('connect', function(connection) {
	connection.on('message', function(message) {
		var data = JSON.parse(message.utf8Data);
		var songs = data.queue;

		console.log('[' + moment().tz('Asia/Tokyo').format('LLL') + '] Length: ' + songs.length);
		currentLength = songs.length;

		if (songs.length < 5) {
			requestRandom();
		};
	});

	connection.on('close', function() {
		ws.connect(hostname);
	});

	setInterval(function() {
		if (currentLength < 5) {
			requestRandom();
		}
	}, 1 * 60 * 1000);
});

ws.connect(hostname);
