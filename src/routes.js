
const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')

// for FCM
const FCM = require('fcm-node');
const topics = {key_asser:"Asser",
				key_cezanne:"Cezanne",
				key_jlin:"Jessica",
				key_lyla:"Lyla",
				key_nikita:"Nikita"
				};

router.get('/', (req, res) => {
  res.render('index')
})


router.get('/contact', (req, res) => {
  res.render('contact', {
    data: {},
    errors: {},
	csrfToken: req.csrfToken()
  })
})


router.post('/contact', [
  check('server_key')
    .isLength({ min: 1 })
    .withMessage('Server key is required')
    .trim(),
  check('message')
    .isLength({ min: 1 })
    .withMessage('Message is required')
    .trim(),
  // check('email')
    // .isEmail()
    // .withMessage('That email doesn‘t look right')
    // .trim()
    // .normalizeEmail(),
	check('topic')
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.render('contact', {
      data: req.body,
      errors: errors.mapped(),
      csrfToken: req.csrfToken()
    })
  }

  const data = matchedData(req)
  console.log('Sanitized:', data)
  console.log('req.body.topic:', req.body.topic)
  
  // for FCM
  const serverKey = data.server_key; //put your server key here
  const fcm = new FCM(serverKey);
  if (data.topic === 'key_random') {
	  var topic_keys = Object.keys(topics);
	  var random_key = topic_keys[Math.floor(Math.random()*topic_keys.length)];
	  data.topic = random_key;
  }
  const msg = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
		to: '/topics/' + data.topic, 	
		data: {  //you can send only notification or only data(or include both)
			author: 'TheReal' + topics[data.topic],
			message:	data.message,
			date:	Date.now().toString(),
			authorKey: data.topic
		}
	};

  fcm.send(msg, function(err, response){
		if (err) {
			console.log("Something has gone wrong!", err);
			req.flash('error', 'Something has gone wrong!. Please check your server key.');
		} else {
			console.log("Successfully sent with response: ", response);
			req.flash('success', 'Thanks for the message! I‘ll be in touch :).Please see the push notification message you sent.');
			req.flash('msg', JSON.stringify(msg));
		}
		res.redirect('/')
	});
  
  // console.log("Smessage !  ", message);
  // for (property in message) {
  // console.log(property, '= ', JSON.stringify(message[property]));
  // }
  
})

module.exports = router
