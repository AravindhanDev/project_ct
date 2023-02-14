import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();
const PORT = process.env.PORT || 3000;

app.use( express.urlencoded( { extended: true } ) );
app.use( cors() );
app.use( express.json() );
mongoose.set( "strictQuery", false );

mongoose.connect( "mongodb://localhost:27017/appDB", () => {
	console.log( "Connected to database" );
} );

const userSchema = new mongoose.Schema( {
	name: String,
	eid: {
		type: Number,
		unique: true
	},
	password: String
} );

const appSchema = new mongoose.Schema( {
	Category: String,
	Rating: String,
	Installs: String,
	Free: Boolean,
	Price: String,
	Currency: String,
	Size: String,
	Released: String,
	appName: String,
	appId: String,
	minimumAndroid: String,
	developerId: String,
	developerWebsite: String,
	developerEmail: String,
	privacyPolicy: String,
	adSupported: Boolean,
	inAppPurchases: Boolean,
	lastUpdated: String,
	editorsChoice: Boolean,
	scrapedTime: String,
	contentRating: String,
	minimumInstalls: String,
	maximumInstalls: String,
	ratingCount: String
} );

const User = mongoose.model( "User", userSchema );
const App = mongoose.model( "App", appSchema );

app.post( "/register", async ( req, res ) => {
	try {
		let { name, eid, password } = req.body;
		let hash = await bcrypt.hash( password, 10 );
		const user = new User( { name, eid, password: hash } );
		await user.save();
		res.send( { msg: "created" } );
	} catch ( e ) {
		res.send( { msg: "exists" } );
	}
} );

app.post( "/login", async ( req, res ) => {
	let { eid, password } = req.body;
	let user = await User.findOne( { eid } );
	if ( user === null ) {
		res.send( { msg: "incorrect eid", auth: false } );
		return;
	}
	let result = await bcrypt.compare( password, user.password );
	console.log( result );
	if ( result ) {
		res.send( { auth: true } );
	} else {
		res.send( { msg: "incorrect password", auth: false } );
	}
} );

app.get( "/load_data", async ( req, res ) => {
	const appJson = await App.find(
		{ $and: [ { Rating: { $gt: "4.0" }, $or: [ { Installs: "10,000,000+" }, { Installs: "50,000,000+" }, { Installs: "100,000,000+" }, { Installs: "500,000,000+" }, { Installs: "1,000,000,000+" }, { Installs: "5,000,000,000+" } ] } ] },
		{
			appName: 1,
			developerId: 1,
			adSupported: 1,
			inAppPurchases: 1,
			Rating: 1,
			Size: 1,
			Installs: 1,
			privacyPolicy: 1,
			developerWebsite: 1,
			developerEmail: 1,
			minimumAndroid: 1,
			appId: 1,
			Category: 1
		}
	).limit( 10 );
	res.send( { data: appJson } );
} );

app.get( "/recommend_data", async ( req, res ) => {
	try {
		const categoryApps = await App.find( req.query, {
			appName: 1,
			developerId: 1,
			adSupported: 1,
			inAppPurchases: 1
		} ).limit( 3 );
		res.send( { data: categoryApps } );
	} catch ( e ) {
		console.error( e );
	}
} );

app.get( "/load_scroll", async ( req, res ) => {
	let limit = 10;
	if ( req.query ) {
		limit = req.query.currentCount;
	}
	const appJson = await App.find(
		{ Rating: { $gt: "4.0" } },
		{
			appName: 1,
			developerId: 1,
			adSupported: 1,
			inAppPurchases: 1,
			Rating: 1,
			Size: 1,
			Installs: 1,
			privacyPolicy: 1,
			developerWebsite: 1,
			developerEmail: 1,
			minimumAndroid: 1,
			appId: 1,
			Category: 1
		}
	).limit( limit );
	res.send( { data: appJson } );
} );

app.get( "/analysis", async ( req, res ) => {
	let limit = 10;
	if ( req.query ) {
		limit = req.query.currentCount;
		console.log( 'limit', limit );
	}
	try {
		let obj = req.query;
		if ( req.query.currentCount ) {
			delete req.query.currentCount;
		}
		if ( obj.Rating ) {
			let ratingRange = obj.Rating;
			delete obj.Rating;
			let ratingStart = ratingRange.substring( 0, 3 );
			let ratingEnd = ratingRange.substring( 6, ratingRange.length );
			obj.Rating = { $lt: ratingEnd, $gt: ratingStart };
		} else {
			obj.Rating = { $gt: '4.0' };
		}
		if ( obj.Installs && obj.Installs.charAt( obj.Installs.length - 1 ) === " " ) {
			obj.Installs = obj.Installs.substring( 0, obj.Installs.length - 1 ) + "+";
		}
		if ( obj.minimumAndroid ) {
			let min = obj.minimumAndroid;
			obj.minimumAndroid = new RegExp( `.*${ min }.*` );
		}
		let result = await App.find(
			{ ...obj },
			{
				appName: 1,
				developerId: 1,
				adSupported: 1,
				inAppPurchases: 1,
				Rating: 1,
				Size: 1,
				Installs: 1,
				privacyPolicy: 1,
				developerWebsite: 1,
				developerEmail: 1,
				minimumAndroid: 1,
				appId: 1,
				Category: 1
			}
		).limit( limit );
		res.send( { data: result } );
	} catch ( e ) {
		console.log( "error" );
	}
} );

app.get( "/search_apps", async ( req, res ) => {
	try {
		let limit = 10;
		let { appName, currentCount } = req.query;
		if ( currentCount ) {
			limit = currentCount;
		}
		let appNameRegex = new RegExp( `.*${ appName }.*`, "i" );
		let appData = await App.find(
			{ $and: [ { appName: appNameRegex, $or: [ { Installs: "10,000,000+" }, { Installs: "50,000,000+" }, { Installs: "100,000,000+" }, { Installs: "500,000,000+" }, { Installs: "1,000,000,000+" }, { Installs: "5,000,000,000+" } ] } ] },
			{
				appName: 1,
				developerId: 1,
				adSupported: 1,
				inAppPurchases: 1,
				Rating: 1,
				Size: 1,
				Installs: 1,
				privacyPolicy: 1,
				developerWebsite: 1,
				developerEmail: 1,
				minimumAndroid: 1,
				appId: 1,
				Category: 1
			}
		).limit( limit );
		res.send( { data: appData } );
	} catch ( e ) {
		console.log( "error" );
	}
} );

app.listen( PORT, () => console.log( `Server listening on ${ PORT }` ) );
