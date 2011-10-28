/* api_request - v0.5.0
 * ----------------------------------------------------------------------------
 * Simple library for defining API requests asynchronously.
 * Creates readable requests using a fuild chainable interface
 * ----------------------------------------------------------------------------
 * This code is being released under an MIT style license:
 *
 * Copyright (c) 2010 Jillian Ada Burrows
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ------------------------------------------------------------------------------
 * Original Author: Jillian Ada Burrows
 * Email:           jill@adaburrows.com
 * Website:         <http://www.adaburrows.com>
 * Facebook:        <http://www.facebook.com/jillian.burrows>
 * Twitter:         @jburrows
 * ============================================================================
 */

/* Include necessary modules */
var events = require('events');
var querystring = require('querystring');

/*
 * Define a non-enumerable function to allow ease of extending objects.
 */
Object.defineProperty(Object.prototype, "extend", {
  enumerable: false,
  value: function (from) {
    var props = Object.getOwnPropertyNames(from);
    var dest = this;
    props.forEach(function(name) {
      var descriptor = Object.getOwnPropertyDescriptor(from, name);
      Object.defineProperty(dest, name, descriptor);
    });
    return this;
  }
});

/*
 * Define the main api_request contsructor, also inheirit from EventEmmitter
 */
function api_request(protocol, host, portnum) {
  // Call EventEmitter constructor on this context
  events.EventEmitter.call(this);
  var http, port, content_encoders, content_handlers, request_options, response, reply, payload;
  if (portnum){
    port = portnum;
  } else {
    port = 80;
  }
  this.response = false;
  this.reply = '';
  this.payload = false;
  this.params = false;
  this.request_options = {
    'host': host,
    'port': port,
    'path': '/',
    'method': 'GET',
    'headers': {
    }
  };
  this.http = require(protocol);
  this.content_encoders = {
    'application/json': function(data) {
      return JSON.stringify(data);
    },
    'application/x-www-form-ulrencoded': function(data) {
      return querystring.stringify(data);
    }
  };
  this.content_handlers = {
    'application/json': function(data) {
      return JSON.parse(data);
    },
    'application/x-www-form-ulrencoded': function(data) {
      return querystring.parse(data);
    }
  };
}
api_request.super_ = events.EventEmmitter;
api_request.prototype = Object.create(
  events.EventEmitter.prototype,
  {
    constructor: {
      value: api_request,
      enumerable: false
    }
  }
);

/*
 * Adds content encoders to encode the data before sending it to the server.
 */
api_request.prototype.add_content_encoders = function(encoders) {
  this.content_encoders.extend(encoders);
};

/*
 * Adds content handlers to decode various type of data.
 */
api_request.prototype.add_content_handlers = function(encoders) {
  this.content_handlers.extend(encoders);
};

/*
 * Adds headers or changes headers to the request
 */
api_request.prototype.add_headers = function(headers) {
  this.request_options.headers.extend(headers);
  return this;
};

/*
 * Sets the length of the content
 */
api_request.prototype.set_length = function(length) {
  this.request_options.headers.extend({
    'Content-Length': length
  });
  return this;
};

/*
 * Adds basic authorization to a request
 */
api_request.prototype.with_basic_auth = function(username, password) {
  this.request_options.headers.extend({
    'Authorization': 'Basic '+(new Buffer(username+":"+password).toString('base64'))
  });
  return this;
};

/*
 * Sets the content type
 */
api_request.prototype.with_content_type = function(type) {
  this.request_options.headers.extend({
    'Content-Type': type
  });
  return this;
};

/*
 * Set the query string
 */
api_request.prototype.with_params = function(params) {
  this.params = querystring.stringify(params);
  return this;
};

/*
 * Set the payload(content) to be sent as the request body
 */
api_request.prototype.with_payload = function(payload) {
  var type = this.request_options.headers['Content-Type'];
  if(this.content_encoders[type]) {
    this.payload = this.content_encoders[type](payload);
  } else {
    this.payload = payload;
  }
  return this;
};

/*
 * Performs a 'GET' request
 */
api_request.prototype.get = function(p) {
  var full_path = p;
  if(this.params) full_path = full_path + '?' + this.params;
  this.request_options.extend({
    method: 'GET',
    path: full_path
  });
  this.go();
  return this;
};

/*
 * Performs a 'POST' request
 */
api_request.prototype.post = function(p) {
  this.request_options.extend({
    method: 'POST',
    path: p
  });
  this.go();
  return this;
};

/*
 * Performs a 'PUT' request
 */
api_request.prototype.put = function(p) {
  this.request_options.extend({
    method: 'PUT',
    path: p
  });
  this.go();
  return this;
};

/*
 * Performs a 'DELETE' request
 */
api_request.prototype.del = function(p) {
  this.request_options.extend({
    method: 'DELETE',
    path: p
  });
  this.go();
  return this;
};

/*
 * Performs the request
 */
api_request.prototype.go = function() {
  var self = this;
  if(this.payload) {
    this.set_length(Buffer.byteLength(this.payload));
  } else {
    this.set_length(0);
  }
  var req = this.http.request(
    this.request_options,
    function(res) {
      self.response = res;
      self.process_response(self.response);
    }
  );
  req.on('error', function(e) {
    self.emit('error', e);
  });
  if (this.payload) {
    req.write(this.payload);
  }
  req.end();
};

/*
 * Sets the encoding and unchunks the response
 */
api_request.prototype.process_response = function(res) {
  var self = this;
  res.setEncoding('utf8');
  res.on('data', function(chunk) {
    self.reply += chunk;
  });
  res.on('end', function() {
    self.process_data();
  });
  res.on('close', function() {
    self.process_data();
  });
};

/*
 * Decodes the data and emits a 'reply' event passing in the parsed reply and
 * the response object for grabbing headers and the status code.
 */
api_request.prototype.process_data = function() {
  var content_type = '';
  // get the content type: try both cases since servers aren't picky
  if(this.response.headers['Content-Type'])
    type = this.response.headers['Content-Type'];
  if(this.response.headers['Content-type'])
    type = this.response.headers['Content-type'];
  if(this.response.headers['content-type'])
    type = this.response.headers['content-type'];
  if(this.content_handlers[type])
    this.reply = this.content_handlers[type](this.reply);
  this.emit('reply', this.reply, this.response);
};

module.exports = api_request;
