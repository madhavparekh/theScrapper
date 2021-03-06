var mongoose = require('mongoose');

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new SacBeeLatestSchema object
// This is similar to a Sequelize model
var SacBeeLatestSchema = new Schema({
	// `title` is required and of type String
	title: {
		type: String,
		required: true,
	},
	// `description` is required and of type String
	description: {
		type: String,
		required: true,
	},
	// `isSaved` type Boolean
	isSaved: {
		type: Boolean,
		default: false,
		required: true,
	},
	// `likes` is required and of type String
	// likes: {
	// 	type: Number,
	// 	default: 0,
	// },
	// `link` is required and of type String
	link: {
		type: String,
		required: true,
	},
	// `img` is required and of type String
	img: {
		type: String,
		required: true,
	},
	// `comment` is an object that stores a Comment id
	// The ref property links the ObjectId to the Comment model
	// This allows us to populate the SacBeeLatest with an associated Comment
	comments: [{
		type: Schema.Types.ObjectId,
		ref: 'Comment',
	}],
});

// This creates our model from the above schema, using mongoose's model method
var SacBeeLatest = mongoose.model('SacBeeLatest', SacBeeLatestSchema);

// Export the SacBeeLatest model
module.exports = SacBeeLatest;
