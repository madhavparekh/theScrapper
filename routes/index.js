var express = require('express');
var router = express.Router();

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require('axios');
var cheerio = require('cheerio');

// Require all models
var db = require('../models');

// Routes

// A GET route for scraping the echoJS website
router.get('/scrape', function(req, res) {
	// First, we grab the body of the html with request
	axios.get('http://www.sacbee.com/latest-news/').then(function(response) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(response.data);

		// Now, we grab every h2 within an article tag, and do the following:
		$('.teaser').each(function(i, element) {
			// Save an empty result object
			var result = {};

			// Add the text and href of every link, and save them as properties of the result object
			result.title = $(this)
				.children('.title')
				.children('a')
				.text()
				.trim();
			result.description = $(this)
				.text()
				.trim();
			result.link = $(this)
				.children('.title')
				.children('a')
				.attr('href');
			result.img = $(this)
				.children('div')
				.children('div')
				.children('a')
				.children('img')
				.attr('data-proxy-image');

			db.SacBeeLatest.findOneAndUpdate({ link: result.link }, result, {
				upsert: true,
				new: true,
			})
				.then(function(dbSacBeeLatest) {
					// View the added result in the console
					//console.log(dbSacBeeLatest);
				})
				.catch(function(err) {
					// If an error occurred, send it to the client
					return res.json(err);
				});
		});

		// If we were able to successfully scrape and save an Article, send a message to the client
		res.send('Scrapped');
	});
});

// Route for getting all Articles from the db
router.get('/latest', function(req, res) {
	// Grab every document in the Articles collection
	db.SacBeeLatest.find({})
		.sort({ _id: -1 })
		.limit(20)
		.then(function(dbSacBeeLatest) {
			// If we were able to successfully find Articles, send them back to the client
			res.json(dbSacBeeLatest);
		})
		.catch(function(err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for getting all Articles from the db
router.get('/latest/saved', function(req, res) {
	// Grab every document in the Articles collection
	db.SacBeeLatest.find({ isSaved: true })
		.sort({ _id: -1 })
		.limit(20)
		.then(function(dbSacBeeLatest) {
			// If we were able to successfully find Articles, send them back to the client
			res.json(dbSacBeeLatest);
		})
		.catch(function(err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for saving/updating an Article's associated Comment
router.put('/latest/save/:id', function(req, res) {
	// Create a new Comment and pass the req.body to the entry
	db.SacBeeLatest.findByIdAndUpdate(req.params.id, req.body, { new: true })
		.then(function(dbSacBeeLatest) {
			// If we were able to successfully update an Article, send it back to the client
			res.json(dbSacBeeLatest);
		})
		.catch(function(err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for grabbing a specific Article by id, populate it with it's Comment
router.get('/latest/saved/comments/:id', function(req, res) {
	// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
	db.SacBeeLatest.findOne({ _id: req.params.id })
		// ..and populate all of the Comments associated with it
		.populate({ path: 'comments', options: { sort: { _id: -1 } } })
		.then(function(dbSacBeeLatest) {
			// If we were able to successfully find an Article with the given id, send it back to the client
			res.json(dbSacBeeLatest);
		})
		.catch(function(err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

// Route for saving/updating an Article's associated Comment
router.post('/latest/saved/comment/:id', function(req, res) {
	// Create a new Comment and pass the req.body to the entry
	db.Comment.create(req.body)
		.then(function(dbComment) {
			// If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
			// { new: true } tells the query that we want it to return the updated User -- it returns the original by default
			// Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
			return db.SacBeeLatest.findOneAndUpdate(
				{ _id: req.params.id },
				{ $push: { comments: dbComment._id } },
				{ new: true }
			);
		})
		.then(function(dbSacBeeLatest) {
			// If we were able to successfully update an Article, send it back to the client
			res.json(dbSacBeeLatest);
		})
		.catch(function(err) {
			// If an error occurred, send it to the client
			res.json(err);
		});
});

router.delete('/saved/:id/comment/:comm_id', (req, res) => {
	db.Comment.findByIdAndRemove(req.params.comm_id)
		.then((dbComment) => {
			return db.SacBeeLatest.findByIdAndUpdate(
				{ _id: req.params.id },
				{ $pull: { comments: dbComment._id } },
				{ new: true }
			);
		})
		.then((dbSacBeeLatest) => {
			const response = {
				message: 'Comment successfully deleted',
			};
			return res.status(200).send(response);
		})
		.catch((err) => {
			res.json(err);
		});
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Express' });
});

module.exports = router;
