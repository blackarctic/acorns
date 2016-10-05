let store = (function () {

	/* defaults */

	let ui_defaults = {
		all_places_view_length: 10,
		all_things_view_length: 10,
		things_view_length: 5,
		moving_things_view_length: 3,
		history_view_length: 5,
		view_history: false,
		username_guidelines: "Only letters and numbers. 16 characters or less.",
		password_guidelines: "Must include lowercase, uppercase, and number.",
	};

	let get_ui_default = function(key) {
		if (ui_defaults.hasOwnProperty(key)) {
			return ui_defaults[key];
		}
		return undefined;
	};


	/* data */

	let data = {
		places: {},
		things: {},
		users: {},
		user: {},
		ui: {
			alerts: [],
			place: {},
			thing: {},
			user: {},
			places_filter: "",
			things_filter: "",
			add_to_moving_things_filter: "",
			moving_things: [],
			moving_to_place_id: "",
			all_places_view_length: ui_defaults.all_places_view_length,
			all_things_view_length: ui_defaults.all_things_view_length,
			things_view_length: ui_defaults.things_view_length,
			moving_things_view_length: ui_defaults.moving_things_view_length,
			history_view_length: ui_defaults.history_view_length,
			view_history: ui_defaults.view_history,
			username_guidelines: ui_defaults.username_guidelines,
			password_guidelines: ui_defaults.password_guidelines,
		},
	};

	let get_data = function () {
		return data;
	};


	/* utilities */

	let uuid = function() {
		// from https://jsfiddle.net/briguy37/2MVFd/
		let d = new Date().getTime();
		let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			let r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c=="x" ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	};

	String.prototype.custom_escape_html = function() {
		// from http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
		let div = document.createElement('div');
		div.appendChild(document.createTextNode(this));
		return div.innerHTML;
	};

	let clear_obj = function (obj) {
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				delete obj[key];
			}
		}
		return obj;
	};

	let take_place_snapshot = function (place) {
		// create a snapshot of a place to be stored in a history log
		let place_snapshot = Object.assign({}, place);
		delete place_snapshot.things;
		delete place_snapshot.history;
		return place_snapshot;
	};

	let take_thing_snapshot = function (thing) {
		// create a snapshot of a thing to be stored in a history log
		let thing_snapshot = Object.assign({}, thing);
		delete thing_snapshot.place;
		delete thing_snapshot.history;
		return thing_snapshot;
	};


	/* initialization */

	let initialize = function () {

		// create test data
		let test_thing_0 = {
			id: "37f359cf-3594-4f56-a0c4-938430682b89",
			tracking: "DJN34",
			serial: "DIM3KM-D3KM4-KMK3M4",
			model: "JNJ3J30",
			brand: "Samsung",
			type: "EVO",
			place: null,
			history: [],
		};
		let test_thing_1 = {
			id: "e7cbf7c3-abb3-46bb-8246-0e31ce29d83f",
			tracking: "13GB2",
			serial: "134IB-457TY-98HBV",
			model: "C10",
			brand: "Apple",
			type: "iPhone 6S",
			place: null,
			history: [],
		};
		let test_place_0 = {
			id: "c3f8dd61-10ea-4c8a-9c63-f2d6c11e039b",
			name: "Warren Redding",
			address_line_1: "6700 N Benson",
			address_line_2: "",
			address_city: "Barrington",
			address_state: "IL",
			address_zip: "75001",
			email: "wred@gmail.com",
			phone: "3125407000",
			notes: "",
			things: {},
			things_count: 0,
			history: [],
		};
		let test_place_1 = {
			id: "c3f8dd61-10ea-4c8a-9c63-f2d6c144039b",
			name: "Riley Urch",
			things: {},
			things_count: 0,
			history: [],
		};
		let test_user_0 = {
			id: "c3f8dd61-140a-4c8a-9c63-f2d6c11e039b",
			first_name: "John",
			last_name: "Mogley",
			email: "jmogley@email.com",
			username: "john",
			password: "password",
			preferences: {
				receive_email_notifications: true,
			},
		};

		// link test data
		test_thing_0.place = test_place_0;
		test_thing_1.place = test_place_0;
		Vue.set(test_place_0.things, test_thing_0.id, test_thing_0);
		Vue.set(test_place_0.things, test_thing_1.id, test_thing_1);

		// insert test data
		Vue.set(data.users, test_user_0.id, test_user_0);
		Vue.set(data.things, test_thing_0.id, test_thing_0);
		Vue.set(data.things, test_thing_1.id, test_thing_1);
		Vue.set(data.places, test_place_0.id, test_place_0);
		Vue.set(data.places, test_place_1.id, test_place_1);
		data.user = test_user_0;
		data.places[test_place_0.id].things_count = 2;
	};


	/* alerts */

	let do_alert = function (type, title, message) {
		// create the alert
		data.ui.alerts.push({type, title, message});
		console.log(`${title}: ${message}`);
		
		// remove the alert after 2 seconds (matched in css)
		setTimeout(function () {
			data.ui.alerts.shift();
		}, 2000);
	}


	/* users */

	let attempt_login = function () {
		// copy the user and assign id
		let user = Object.assign({}, data.ui.user);

		// clean up the attributes
		if (user.username) user.username = user.username.trim().toLowerCase();

		// check the attributes
		if (!user.username) {
			return { error:true, type:"MISSING_USERNAME" };
		}
		if (!user.password) {
			return { error:true, type:"MISSING_PASSWORD" };
		}

		// attempt the login
		for (let i in data.users) {
			if (data.users.hasOwnProperty(i)) {
				let potential = data.users[i];
				if (potential.username === user.username ||
					potential.email === user.username) {
					if (potential.password === user.password) {
						data.ui.user = {};
						data.user = Object.assign({}, potential);
						return data.user;
					}
				}
			}
		}
		return { error:true, type:"LOGIN_FAILED" };
	};

	let logout = function () {
		data.user = {};
	};

	let get_user = function (id) {
		if (data.users.hasOwnProperty(id)) {
			return data.users[id];
		}
		return { error:true, type:"USER_NOT_FOUND" };
	};

	let create_user = function () {
		// copy the user and assign id
		let user = Object.assign({id: uuid(), role: "admin"}, data.ui.user);

		// clean up the attributes
		if (user.first_name) user.first_name = user.first_name.trim();
		if (user.last_name) user.last_name = user.last_name.trim();
		if (user.email) user.email = user.email.trim().toLowerCase();
		if (user.confirm_email) user.confirm_email = user.confirm_email.trim().toLowerCase();
		if (user.username) user.username = user.username.toLowerCase();
		user.preferences = {};

		// check the attributes
		if (!user.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!user.first_name) {
			return { error:true, type:"MISSING_FIRST_NAME" };
		}
		if (!user.last_name) {
			return { error:true, type:"MISSING_LAST_NAME" };
		}
		if (!user.email) {
			return { error:true, type:"MISSING_EMAIL" };
		}
		if (user.email !== user.confirm_email) {
			return { error:true, type:"EMAIL_MISMATCH" };
		}
		if (!user.username) {
			return { error:true, type:"MISSING_USERNAME" };
		}
		if (!user.password) {
			return { error:true, type:"MISSING_PASSWORD" };
		}
		if (user.email.length > 50 ||
			user.email.lastIndexOf("@") === -1 ||
			user.email.lastIndexOf(".") === -1 ||
			user.email.lastIndexOf("@") > user.email.lastIndexOf(".")) {
			return { error:true, type:"INVALID_EMAIL" };
		}
		if (user.username.length > 16 ||
			user.username.search(/^[a-zA-Z0-9]*$/) !== 0) {
			return { error:true, type:"INVALID_USERNAME" };
		}
		if (user.password.length < 8 ||
			user.password.length > 50 ||
			user.password.search(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{0,}$/) !== 0) {
			return { error:true, type:"INVALID_PASSWORD" };
		}
		if (user.first_name.length > 50) {
			return { error:true, type:"INVALID_FIRST_NAME" };
		}
		if (user.last_name.length > 50) {
			return { error:true, type:"INVALID_LAST_NAME" };
		}

		// clear out unnecessities
		delete user.confirm_email;

		// add the user
		if (!data.users.hasOwnProperty(user.id)) {
			Vue.set(data.users, user.id, user);
		}
		else {
			return { error:true, type:"DUPLICATE_ID" };
		}

		// clear the ui user
		data.ui.user = {};

		// log in as user
		data.user = user;

		// return the newly created user
		return user;
	};

	let update_user = function () {
		// copy the user
		let user = Object.assign({}, data.ui.user);

		// clean up the attributes
		if (user.first_name) user.first_name = user.first_name.trim();
		if (user.last_name) user.last_name = user.last_name.trim();
		if (user.email) user.email = user.email.trim().toLowerCase();
		if (user.confirm_email) user.confirm_email = user.confirm_email.trim().toLowerCase();
		if (user.username) user.username = user.username.toLowerCase();
		if (user.new_password) user.password = user.new_password;
		if (!user.change_email) {
			user.email = data.user.email;
			user.confirm_email = data.user.email;
		}
		if (!user.change_password) {
			user.old_password = data.user.password;
			user.password = data.user.password;
			user.new_confirm_password = data.user.password;
		}

		// check the attributes
		if (!user.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!user.first_name) {
			return { error:true, type:"MISSING_FIRST_NAME" };
		}
		if (!user.last_name) {
			return { error:true, type:"MISSING_LAST_NAME" };
		}
		if (!user.email) {
			return { error:true, type:"MISSING_EMAIL" };
		}
		if (user.email !== user.confirm_email && user.change_email) {
			return { error:true, type:"EMAIL_MISMATCH" };
		}
		if (user.old_password !== data.user.password && user.change_password) {
			return { error:true, type:"OLD_PASSWORD_MISMATCH" };
		}
		if (user.password !== user.new_confirm_password && user.change_password) {
			return { error:true, type:"PASSWORD_MISMATCH" };
		}
		if (!user.username) {
			return { error:true, type:"MISSING_USERNAME" };
		}
		if (!user.password && user.change_password) {
			return { error:true, type:"MISSING_PASSWORD" };
		}
		if ((user.email.length > 50 ||
			user.email.lastIndexOf("@") === -1 ||
			user.email.lastIndexOf(".") === -1 ||
			user.email.lastIndexOf("@") > user.email.lastIndexOf(".")) &&
			user.change_email) {
			return { error:true, type:"INVALID_EMAIL" };
		}
		if (user.username.length > 16 ||
			user.username.search(/^[a-zA-Z0-9]*$/) !== 0) {
			return { error:true, type:"INVALID_USERNAME" };
		}
		if ((user.password.length < 8 ||
			user.password.length > 50 ||
			user.password.search(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{0,}$/) !== 0) &&
			user.change_password) {
			return { error:true, type:"INVALID_PASSWORD" };
		}
		if (user.first_name.length > 50) {
			return { error:true, type:"INVALID_FIRST_NAME" };
		}
		if (user.last_name.length > 50) {
			return { error:true, type:"INVALID_LAST_NAME" };
		}

		// clear out unnecessities
		delete user.confirm_email;
		delete user.old_password;
		delete user.new_password;
		delete user.new_confirm_password;
		delete user.change_email;
		delete user.change_password;

		// update the user in users
		if (data.users.hasOwnProperty(user.id)) {
			Vue.set(data.users, user.id, user);
		}
		else {
			return { error:true, type:"USER_NOT_FOUND" };
		}

		// clear the ui place
		data.ui.user = {};

		// update logged in user
		data.user = user;

		// return the updated place
		return user;
	};

	let remove_user = function () {
		// copy the user
		let user = Object.assign({}, data.ui.user);

		// remove the user
		if (data.users.hasOwnProperty(user.id)) {
			delete data.users[user.id];
		}
		else {
			return { error:true, type:"USER_NOT_FOUND" };
		}

		// clear the ui user
		data.ui.user

		// return the removed user
		return user;
	};


	/* places */

	let get_place = function (id) {
		if (data.places.hasOwnProperty(id)) {
			return data.places[id];
		}
		return { error:true, type:"PLACE_NOT_FOUND" };
	};

	let create_place = function () {
		// copy the place and assign id
		let place = Object.assign({id: uuid()}, data.ui.place);

		// clean up the attributes
		place.name = place.name.trim();
		if (place.address_line_1) place.address_line_1 = place.address_line_1.trim();
		if (place.address_line_2) place.address_line_2 = place.address_line_2.trim();
		if (place.address_city) place.address_city = place.address_city.trim();
		if (place.address_state) place.address_state = place.address_state.trim();
		if (place.address_zip) place.address_zip = place.address_zip.trim();
		if (place.email) place.email = place.email.trim();
		if (place.phone) place.phone = place.phone.trim().replace(/ |-|\(|\)|\./g,"");
		if (place.notes) place.notes = place.notes.trim();
		place.things = {};
		place.things_count = 0;
		place.history = [];
		if (!place.additional_options) {
			place.address_line_1 = "";
			place.address_line_2 = "";
			place.address_city = "";
			place.address_state = "";
			place.address_zip = "";
			place.email = "";
			place.phone = "";
			place.notes = "";
		}

		// check the attributes
		if (!place.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!place.name) {
			return { error:true, type:"MISSING_NAME" };
		}

		// clear out unnecessities
		delete place.additional_options;

		// set history
		let place_snapshot = take_place_snapshot(place);
		place.history.push({
			type: "PLACE_CREATED",
			time: Date.now(),
			place: place_snapshot,
		});

		// add the place
		if (!data.places.hasOwnProperty(place.id)) {
			Vue.set(data.places, place.id, place);
		}
		else {
			return { error:true, type:"DUPLICATE_ID" };
		}

		// clear the ui place
		data.ui.place = {};

		// return the newly created place
		return place;
	};

	let update_place = function () {
		// copy the place
		let place = Object.assign({}, data.ui.place);

		// clean up the attributes
		place.name = place.name.trim();
		if (place.address_line_1) place.address_line_1 = place.address_line_1.trim();
		if (place.address_line_2) place.address_line_2 = place.address_line_2.trim();
		if (place.address_city) place.address_city = place.address_city.trim();
		if (place.address_state) place.address_state = place.address_state.trim();
		if (place.address_zip) place.address_zip = place.address_zip.trim();
		if (place.email) place.email = place.email.trim();
		if (place.phone) place.phone = place.phone.trim().replace(/ |-|\(|\)|\./g,"");
		if (place.notes) place.notes = place.notes.trim();
		if (!place.additional_options) {
			let old_place = data.places[place.id];
			place.address_line_1 = old_place.address_line_1;
			place.address_line_2 = old_place.address_line_2;
			place.address_city = old_place.address_city;
			place.address_state = old_place.address_state;
			place.address_zip = old_place.address_zip;
			place.email = old_place.email;
			place.phone = old_place.phone;
			place.notes = old_place.notes;
		}

		// check the attributes
		if (!place.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!place.name) {
			return { error:true, type:"MISSING_NAME" };
		}

		// clear out unnecessities
		delete place.additional_options;

		// set history
		let old_place = data.places[place.id];
		// compile the properties of the old place and new place 
		let place_props = {};
		for (let prop in place) {
			if (place.hasOwnProperty(prop)) {
				place_props[prop] = true;
			} 
		}
		for (let prop in old_place) {
			if (old_place.hasOwnProperty(prop)) {
				place_props[prop] = true;
			}
		}
		// save the property changes as detail changes
		for (let prop in place_props) {
			let new_val;
			let old_val;
			if (place.hasOwnProperty(prop)) {
				new_val = place[prop];
			}
			if (old_place.hasOwnProperty(prop)) {
				old_val = old_place[prop];
			}
			if (new_val && old_val) {
				if (new_val !== old_val) {
					place.history.push({
						type: "PLACE_DETAIL_UPDATED",
						time: Date.now(),
						name: prop,
						from: old_val,
						to: new_val
					});
				}
			}
			if (new_val && !old_val) {
				place.history.push({
					type: "PLACE_DETAIL_ADDED",
					time: Date.now(),
					name: prop,
					val: new_val
				});
			}
			if (!new_val && old_val) {
				place.history.push({
					type: "PLACE_DETAIL_REMOVED",
					time: Date.now(),
					name: prop,
					val: old_val
				});
			}
		}

		// update the place in places
		if (data.places.hasOwnProperty(place.id)) {
			Vue.set(data.places, place.id, place);
		}
		else {
			return { error:true, type:"PLACE_NOT_FOUND" };
		}

		// update the place in things
		for (let i in place.things) {
			if (place.things.hasOwnProperty(i)) {
				place.things[i].place = place;
			}
		}

		// clear the ui place
		data.ui.place = {};

		// return the updated place
		return place;
	};

	let remove_place = function () {
		// copy the place
		let place = Object.assign({}, data.ui.place);

		// remove the place
		if (data.places.hasOwnProperty(place.id)) {
			if (data.places[place.id].things_count > 0) {
				return { error:true, type:"PLACE_NOT_EMPTY", place: place };
			}
			delete data.places[place.id];
		}
		else {
			return { error:true, type:"PLACE_NOT_FOUND" };
		}

		// clear the ui place
		data.ui.place = {};

		// return the removed place
		return place;
	};

	let move_things_to_place = function () {
		// copy the place
		let new_place = data.places[data.ui.place.id];

		// check the attributes
		if (!data.ui.moving_things.length) {
			return { error:true, type:"MISSING_THINGS" };
		}

		// set history
		for (let i=0; i<data.ui.moving_things.length; i++) {
			let thing = data.ui.moving_things[i];
			let old_place = thing.place;
			let thing_snapshot = take_thing_snapshot(data.ui.moving_things[i]);
			let old_place_snapshot = take_place_snapshot(old_place);
			let new_place_snapshot = take_place_snapshot(new_place);
			new_place.history.push({
				type: "THING_ADDED",
				time: Date.now(),
				thing: thing_snapshot,
			});
			old_place.history.push({
				type: "THING_REMOVED",
				time: Date.now(),
				thing: thing_snapshot,
			});
			thing.history.push({
				type: "THING_MOVED",
				time: Date.now(),
				from: old_place_snapshot,
				to: new_place_snapshot,
			});
		}

		// check for things in old place 
		// then remove the things in old place
		for (let i=0; i<data.ui.moving_things.length; i++) {
			let thing = data.ui.moving_things[i];
			let old_place = thing.place;
			if (!old_place || !old_place.things.hasOwnProperty(thing.id)) {
				return { error:true, type:"THING_NOT_FOUND" };
			}
		}
		for (let i=0; i<data.ui.moving_things.length; i++) {
			let thing = data.ui.moving_things[i];
			let old_place = thing.place;
			delete old_place.things[thing.id];
			old_place.things_count -= 1;
		}
		
		// place the things in new place
		if (!new_place) {
			return { error:true, type:"PLACE_NOT_FOUND" };
		}
		for (let i=0; i<data.ui.moving_things.length; i++) {
			let thing = data.ui.moving_things[i];
			Vue.set(new_place.things, thing.id, thing);
		}
		new_place.things_count += data.ui.moving_things.length;

		// update the things with new place
		for (let i=0; i<data.ui.moving_things.length; i++) {
			let thing = data.ui.moving_things[i];
			thing.place = new_place;
		}

		// save the moving things count
		// and clear the ui moving things
		let moving_things_count = data.ui.moving_things.length;
		data.ui.moving_things = [];

		// return the count of updated things and updated place 
		return {
			count: moving_things_count,
			place: new_place,
		};
	};


	/* things */

	let get_thing = function (id) {
		if (data.things.hasOwnProperty(id)) {
			return data.things[id];
		}
		return { error:true, type:"THING_NOT_FOUND" };
	};

	let create_thing = function () {
		// copy the thing and assign id
		let thing = Object.assign({id: uuid()}, data.ui.thing);

		// clean up the attributes
		thing.tracking = thing.tracking.trim().toUpperCase();
		thing.serial = thing.serial.trim().toUpperCase();
		thing.model = thing.model.trim().toUpperCase();
		thing.brand = thing.brand.trim();
		thing.type = thing.type.trim();
		thing.history = [];

		// check the attributes
		if (!thing.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!thing.tracking) {
			return { error:true, type:"MISSING_TRACKING_ID" };
		}
		if (!thing.serial) {
			return { error:true, type:"MISSING_SERIAL_ID" };
		}
		if (!thing.model) {
			return { error:true, type:"MISSING_MODEL_ID" };
		}
		if (!thing.brand) {
			return { error:true, type:"MISSING_BRAND" };
		}
		if (!thing.type) {
			return { error:true, type:"MISSING_TYPE" };
		}
		if (!data.ui.moving_to_place_id) {
			return { error:true, type:"MISSING_PLACE" };
		}

		// set place for thing
		if (data.places.hasOwnProperty(data.ui.moving_to_place_id)) {
			thing.place = data.places[data.ui.moving_to_place_id];
		}
		else {
			return { error: true, type:"PLACE_NOT_FOUND" };
		}

		// set history
		let new_place = thing.place
		let thing_snapshot = take_thing_snapshot(thing);
		let place_snapshot = take_place_snapshot(new_place);
		thing.history.push({
			type: "THING_CREATED",
			time: Date.now(),
			thing: thing_snapshot,
			place: place_snapshot,
		});
		// save place change
		new_place.history.push({
			type: "THING_ADDED",
			time: Date.now(),
			thing: thing_snapshot,
		});

		// add the thing
		if (!data.things.hasOwnProperty(thing.id)) {
			Vue.set(data.things, thing.id, thing);
		}
		else {
			return { error:true, type:"DUPLICATE_ID" };
		}

		// update place with thing
		Vue.set(thing.place.things, thing.id, thing);
		thing.place.things_count += 1;

		// clear the ui thing
		data.ui.thing = {};
		data.ui.moving_to_place_id = "";

		// return the newly created thing
		return thing;
	};

	let update_thing = function () {
		// copy the thing
		let thing = Object.assign({}, data.ui.thing);

		// save old place
		let old_place = thing.place;

		// clean up the attributes
		thing.tracking = thing.tracking.trim().toUpperCase();
		thing.serial = thing.serial.trim().toUpperCase();
		thing.model = thing.model.trim().toUpperCase();
		thing.brand = thing.brand.trim();
		thing.type = thing.type.trim();

		// check the attributes
		if (!thing.id) {
			return { error:true, type:"MISSING_ID" };
		}
		if (!thing.tracking) {
			return { error:true, type:"MISSING_TRACKING_ID" };
		}
		if (!thing.serial) {
			return { error:true, type:"MISSING_SERIAL_ID" };
		}
		if (!thing.model) {
			return { error:true, type:"MISSING_MODEL_ID" };
		}
		if (!thing.brand) {
			return { error:true, type:"MISSING_BRAND" };
		}
		if (!thing.type) {
			return { error:true, type:"MISSING_TYPE" };
		}
		if (!data.ui.moving_to_place_id) {
			return { error:true, type:"MISSING_PLACE" };
		}

		// set place for thing
		if (data.places.hasOwnProperty(data.ui.moving_to_place_id)) {
			thing.place = data.places[data.ui.moving_to_place_id];
		}
		else {
			return { error: true, type:"PLACE_NOT_FOUND" };
		}

		// set history
		let old_thing = data.things[thing.id];
		// compile the properties of the old thing and new thing 
		let thing_props = {};
		for (let prop in thing) {
			if (thing.hasOwnProperty(prop)) {
				thing_props[prop] = true;
			} 
		}
		for (let prop in old_thing) {
			if (old_thing.hasOwnProperty(prop)) {
				thing_props[prop] = true;
			}
		}
		// save the property changes as detail changes
		for (let prop in thing_props) {
			let new_val;
			let old_val;
			if (prop === "place") { // skip. this will be recorded in the next block.
				continue;
			}
			if (thing.hasOwnProperty(prop)) {
				new_val = thing[prop];
			}
			if (old_thing.hasOwnProperty(prop)) {
				old_val = old_thing[prop];
			}
			if (new_val !== undefined && old_val !== undefined) {
				if (new_val !== old_val) {
					thing.history.push({
						type: "THING_DETAIL_UPDATED",
						time: Date.now(),
						name: prop,
						from: old_val,
						to: new_val
					});
				}
			}
			if (new_val !== undefined && old_val === undefined) {
				thing.history.push({
					type: "THING_DETAIL_ADDED",
					time: Date.now(),
					name: prop,
					val: new_val
				});
			}
			if (new_val === undefined && old_val !== undefined) {
				thing.history.push({
					type: "THING_DETAIL_REMOVED",
					time: Date.now(),
					name: prop,
					val: old_val
				});
			}
		}
		// save place change
		let new_place = thing.place;
		if (old_place.id !== new_place.id) {
			let thing_snapshot = take_thing_snapshot(thing);
			let old_place_snapshot = take_place_snapshot(old_place);
			let new_place_snapshot = take_place_snapshot(new_place);
			new_place.history.push({
				type: "THING_ADDED",
				time: Date.now(),
				thing: thing_snapshot,
			});
			old_place.history.push({
				type: "THING_REMOVED",
				time: Date.now(),
				thing: thing_snapshot,
			});
			thing.history.push({
				type: "THING_MOVED",
				time: Date.now(),
				from: old_place_snapshot,
				to: new_place_snapshot,
			});
		}
		
		// update the thing in things
		if (data.things.hasOwnProperty(thing.id)) {
			Vue.set(data.things, thing.id, thing);
		}
		else {
			return { error:true, type:"THING_NOT_FOUND" };
		}

		// remove the thing from old place
		delete old_place.things[thing.id];
		old_place.things_count -= 1;

		// update new place with thing
		Vue.set(thing.place.things, thing.id, thing);
		thing.place.things_count += 1;

		// clear the ui thing
		data.ui.thing = {};
		data.ui.moving_to_place_id = "";

		// return the updated thing
		return thing;
	};

	let remove_thing = function () {
		// copy the thing
		let thing = Object.assign({}, data.ui.thing);

		// set history
		let old_place = thing.place
		let thing_snapshot = take_thing_snapshot(thing);
		let place_snapshot = take_place_snapshot(old_place);
		// save place change
		old_place.history.push({
			type: "THING_REMOVED",
			time: Date.now(),
			thing: thing_snapshot,
		});
		
		// remove the thing from things
		if (data.things.hasOwnProperty(thing.id)) {
			delete data.things[thing.id];
		}
		else {
			return { error:true, type:"THING_NOT_FOUND" };
		}

		// remove the thing from its place
		if (thing.place.things.hasOwnProperty(thing.id)) {
			delete thing.place.things[thing.id];
			thing.place.things_count -= 1;
		}

		// clear the ui thing
		data.ui.thing = {};

		// return the removed thing
		return thing;
	};

	
	/* expose public functionality */

	return {
		initialize,
		get_ui_default,
		get_data,
		do_alert,
		attempt_login,
		logout,
		get_user,
		create_user,
		update_user,
		remove_user,
		get_place,
		create_place,
		update_place,
		remove_place,
		move_things_to_place,
		get_thing,
		create_thing,
		update_thing,
		remove_thing,
	};
})();
