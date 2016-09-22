
/**** filters ****/

Vue.filter("phone", function (val) {
	let phone = val.split("");
	if (phone.length === 11) {
		return phone.slice(0,1).join("") + " " + phone.slice(1,4).join("") + " " + phone.slice(4,7).join("") + " " + phone.slice(7,11).join("");
	}
	if (phone.length === 10) {
		return phone.slice(0,3).join("") + " " + phone.slice(3,6).join("") + " " + phone.slice(6,10).join("");
	}
	if (phone.length === 7) {
		return phone.slice(0,3).join("") + " " + phone.slice(3,7).join("");
	}
	return val;
});

Vue.filter("datetime", function (val) {
	let d = new Date(val);
	let date = d.getDate();
	let month = d.getMonth();
	let year = d.getFullYear();
	let hour = d.getHours();
	let min = d.getMinutes();
	if (hour < 10) hour = "0" + hour;
	if (min < 10) min = "0" + min;
	return `${month}/${date}/${year} ${hour}:${min}`;
});


/**** header ****/

let Header = Vue.extend({
	template: "#header_template",
	data: store.get_data,
	methods: {
		logout: function () {
			let first_name = this.user.first_name;
			store.logout();
			store.do_alert("success", `Goodbye, ${first_name}`, `You have successfully logged out.`);
			this.$router.go(`/login`);
		}
	}
})
Vue.component("app-header", Header);


/**** alerts ****/

let Alerts = Vue.extend({
	template: "#alerts_template",
	data: store.get_data
});
Vue.component("app-alerts", Alerts);

let Alert = Vue.extend({
	template: "#alert_template",
	props: ["alert"],
});
Vue.component("app-alert", Alert);


/**** login ****/

let Login = Vue.extend({
	template: "#login_template",
	data: store.get_data,
	created: function () {
		if (Object.keys(this.users).length === 0) {
			this.$router.go(`/start`);
		}
		if (this.user.username) {
			this.$router.go(`/home`);
		}
	},
	methods: {
		attempt_login: function () {
			let result = store.attempt_login();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_USERNAME":
						error_message = "A username is required."; break;
					case "MISSING_PASSWORD":
						error_message = "A password is required."; break;
					case "LOGIN_FAILED":
						error_message = "Login failed. Please try again."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", `Welcome, ${result.first_name}`, `You have successfully logged in.`);
				this.$router.go(`/home`);
			}
		}
	},
});


/**** start ****/

let Start = Vue.extend({
	template: "#start_template",
	data: store.get_data,
	created: function () {
		if (Object.keys(this.users).length !== 0) {
			this.$router.go(`/home`);
		}
	},
	methods: {
		create_user: function () {
			let result = store.create_user();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_FIRST_NAME":
						error_message = "Your first name is required."; break;
					case "MISSING_LAST_NAME":
						error_message = "Your last name is required."; break;
					case "MISSING_EMAIL":
						error_message = "Your email is required."; break;
					case "EMAIL_MISMATCH":
						error_message = "Your emails do not match."; break;
					case "MISSING_USERNAME":
						error_message = "A username is required."; break;
					case "MISSING_PASSWORD":
						error_message = "A password is required."; break;
					case "INVALID_EMAIL":
						error_message = "Your email is invalid."; break;
					case "INVALID_FIRST_NAME":
						error_message = "Your first name is invalid."; break;
					case "INVALID_LAST_NAME":
						error_message = "Your last name is invalid."; break;
					case "INVALID_USERNAME":
						error_message = "Your username is invalid. Please follow the guidelines."; break;
					case "INVALID_PASSWORD":
						error_message = "Your password is invalid. Please follow the guidelines."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", `Welcome, ${result.first_name}`, `Your account was successfully created.`);
				this.$router.go(`/home`);
			}
		}
	}
});

/**** places ****/

let Place = Vue.extend({
	template: "#place_template",
	data: store.get_data,
	created: function () {
		if (!this.user.username) {
			this.$router.go('/login');
		}
		this.ui.things_filter = "";
		this.ui.view_history = store.get_ui_default("view_history");
		this.ui.history_view_length = store.get_ui_default("history_view_length");
		this.ui.things_view_length = store.get_ui_default("things_view_length");
	},
	computed: {
		place: function () {
			let result = store.get_place(this.$route.params.place_id);
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "PLACE_NOT_FOUND":
						error_message = "Place could not be found.";
						this.$router.go("/");
						break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				return result;
			}
		},
		matching_things: function () {
			let matches = [];
			for (let thing_id in this.place.things) {
				if (this.place.things.hasOwnProperty(thing_id)) {
					let thing = this.place.things[thing_id];
					if (this.matches_things_filter(thing)) {
						matches.push(thing);
					}
				}
			}
			return matches;
		},
	},
	methods: {
		open_edit_place: function () {
			this.ui.place = Object.assign({}, this.place);
			$("#delete_place_confirm").collapse("hide");
			$("#edit_place_modal").modal("show");
		},
		open_move_things_to_place: function () {
			this.ui.add_to_moving_things_filter = "";
			this.ui.moving_things = [];
			this.ui.moving_things_view_length = store.get_ui_default("moving_things_view_length");
			this.ui.place = Object.assign({}, this.place);
			$("#move_things_to_place_modal").modal("show");
		},
		matches_things_filter: function (thing) {
			// extract the filters
			let filters = this.ui.things_filter.split(" ");
			// if we have no filters, show everything
			if (filters.length === 1 && filters[0] === "") {
				return true;
			}
			// go through filters and find matches
			for (let i=0; i<filters.length; i++) {
				let filter = filters[i].toLowerCase().replace(/-|\(|\)|\./g,"");
				if (filter === "") { continue; }
				if (thing.brand.toLowerCase().indexOf(filter) === -1 &&
					thing.type.toLowerCase().indexOf(filter) === -1 &&
					thing.tracking.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.serial.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.model.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1) {
					return false;
				}
			}
			return true;
		},
		history_event_color_class: function (event) {
			switch (event.type) {
				case "PLACE_CREATED":
					return "list-group-item-info";
				case "PLACE_DETAIL_UPDATED":
				case "PLACE_DETAIL_ADDED":
				case "PLACE_DETAIL_REMOVED":
					return "list-group-item-warning";
				case "THING_ADDED":
					return "list-group-item-success";
				case "THING_REMOVED":
					return "list-group-item-danger";
			}
		},
		history_event_heading: function (event) {
			let title = "";
			switch (event.name) {
				case "name": title = "Name"; break;
				case "address_line_1": title = "Address Line 1"; break;
				case "address_line_2": title = "Address Line 2"; break;
				case "address_city": title = "Address City"; break;
				case "address_state": title = "Address State"; break;
				case "address_zip": title = "Address Zip"; break;
				case "email": title = "Email"; break;
				case "phone": title = "Phone"; break;
				case "notes": title = "Notes"; break;
			}
			switch (event.type) {
				case "PLACE_CREATED":
					return `<i class="fa fa-globe" aria-hidden="true"></i> &nbsp; ${event.place.name} created`;
				case "PLACE_DETAIL_UPDATED":
				case "PLACE_DETAIL_ADDED":
				case "PLACE_DETAIL_REMOVED":
					return `<i class="fa fa-pencil" aria-hidden="true" aria-label="Detail Change"></i> &nbsp; ${title}`;
				case "THING_ADDED":
					return `<i class="fa fa-plus" aria-hidden="true" aria-label="Added"></i> &nbsp; ${event.thing.brand} ${event.thing.type}`;
				case "THING_REMOVED":
					return `<i class="fa fa-times" aria-hidden="true" aria-label="Removed"></i> &nbsp; ${event.thing.brand} ${event.thing.type}`;
				default:
					return `Unknown Event Occurred`;
			}
		},
		history_event_body: function (event) {
			switch (event.type) {
				case "PLACE_DETAIL_UPDATED":
					return `<strong>${event.from}</strong> to <strong>${event.to}</strong>`;
				case "PLACE_DETAIL_ADDED":
					return `added <strong>${event.val}</strong>`;
				case "PLACE_DETAIL_REMOVED":
					return `removed <strong>${event.val}</strong>`;
				case "THING_ADDED":
				case "THING_REMOVED":
					return `Tracking: <strong>${event.thing.tracking}</strong><br>Serial: <strong>${event.thing.serial}</strong><br>Model: <strong>${event.thing.model}</strong>`;
			}
		},
	}
});

let Places = Vue.extend({
	template: "#places_template",
	data: store.get_data,
	created: function () {
		if (!this.user.username) {
			this.$router.go('/login');
		}
		this.ui.all_places_view_length = store.get_ui_default("all_places_view_length");
		this.ui.places_filter = "";
	},
	computed: {
		matching_places: function () {
			let matches = [];
			for (let place_id in this.places) {
				if (this.places.hasOwnProperty(place_id)) {
					let place = this.places[place_id];
					if (this.matches_places_filter(place)) {
						matches.push(place);
					}
				}
			}
			return matches;
		}
	},
	methods: {
		open_add_place: function () {
			this.ui.place = {};
			$("#add_place_modal").modal("show");
		},
		matches_places_filter: function (place) {
			// extract the filters
			let filters = this.ui.places_filter.split(" ");
			// if we have no filters, show everything
			if (filters.length === 1 && filters[0] === "") {
				return true;
			}
			// go through filters and find matches
			for (let i=0; i<filters.length; i++) {
				let filter = filters[i].toLowerCase();
				if (filter === "") { continue; }
				if (place.name.toLowerCase().indexOf(filter) === -1) {
					return false;
				}
			}
			return true;
		},
	}
});

let Add_Place = Vue.extend({
	template: "#add_place_template",
	data: store.get_data,
	methods: {
		create_place: function () {
			let result = store.create_place();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_NAME":
						error_message = "A name is required."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.name} was successfully created.`);
				$("#add_place_modal").modal("hide");
				this.$router.go(`/places/${result.id}`);
			}
		},
	},
});
Vue.component("app-add-place", Add_Place);

let Edit_Place = Vue.extend({
	template: "#edit_place_template",
	data: store.get_data,
	methods: {
		edit_place: function () {
			let result = store.update_place();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_NAME":
						error_message = "A name is required."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.name} was successfully updated.`);
				$("#edit_place_modal").modal("hide");
			}
		},
		delete_place: function () {
			let result = store.remove_place();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "PLACE_NOT_FOUND":
						error_message = "Place could not be found."; break;
					case "PLACE_NOT_EMPTY":
						error_message = `${result.place.things_count} ${result.place.things_count === 1 ? "thing still exists" : "things still exist"} in this place.`; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.name} was successfully removed.`);
				$("#edit_place_modal").modal("hide");
				this.$router.go("/places");
			}
		},
	},
});
Vue.component("app-edit-place", Edit_Place);

let Move_Things_To_Place = Vue.extend({
	template: "#move_things_to_place_template",
	data: store.get_data,
	computed: {
		add_list_things: function () {
			let matches = [];
			for (let thing_id in this.things) {
				if (this.things.hasOwnProperty(thing_id)) {
					let thing = this.things[thing_id];
					if (this.can_show_in_add_list(thing)) {
						matches.push(thing);
					}
				}
			}
			return matches;
		},
		remove_list_things: function () {
			let matches = [];
			for (let thing_id in this.ui.moving_things) {
				if (this.ui.moving_things.hasOwnProperty(thing_id)) {
					let thing = this.ui.moving_things[thing_id];
					if (this.can_show_in_remove_list(thing)) {
						matches.push(thing);
					}
				}
			}
			return matches;
		},
	},
	methods: {
		attempt_to_add_to_moving_things: function () {
			// if we can only see one thing at the moment
			let $things = $("#add_to_moving_things_list .add_to_moving_things_item");
			if ($things.length === 1) {
				//simulate click on the thing
				$things[0].click();
			}
		},
		add_to_moving_things: function (thing) {
			this.ui.moving_things.push(thing);
			this.ui.add_to_moving_things_filter = "";
			this.ui.moving_things_view_length = store.get_ui_default("moving_things_view_length");
		},
		remove_from_moving_things: function (thing) {
			for (let i=0; i<this.ui.moving_things.length; i++) {
				if (this.ui.moving_things[i].id === thing.id) {
					this.ui.moving_things.splice(i,1);
					return;
				}
			}
		},
		move_things_to_place: function () {
			let result = store.move_things_to_place();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_THINGS":
						error_message = "No things were specified."; break;
					case "PLACE_NOT_FOUND":
						error_message = "Place could not be found."; break;
					case "THING_NOT_FOUND":
						error_message = "One or more things could not be found."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				let wording = result.count === 1 ? "thing was" : "things were";
				store.do_alert("success", "Success", `${result.count} ${wording} successfully moved to ${result.place.name}.`);
				$("#move_things_to_place_modal").modal("hide");
			}
		},
		can_show_in_add_list: function (thing) {
			return (!this.is_in_moving_things(thing) && !this.is_at_this_place(thing) && this.matches_add_to_moving_things_filter(thing));
		},
		can_show_in_remove_list: function (thing) {
			return (this.is_in_moving_things(thing));
		},
		matches_add_to_moving_things_filter: function (thing) {
			// extract the filters
			let filters = this.ui.add_to_moving_things_filter.split(" ");
			// if we have no filters, show nothing
			if (filters.length === 1 && filters[0] === "") {
				return false;
			}
			// go through filters and find matches
			for (let i=0; i<filters.length; i++) {
				let filter = filters[i].toLowerCase().replace(/-|\(|\)|\./g,"");
				if (filter === "") { continue; }
				if (thing.brand.toLowerCase().indexOf(filter) === -1 &&
					thing.type.toLowerCase().indexOf(filter) === -1 &&
					thing.tracking.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.serial.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.model.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1) {
					return false;
				}
			}
			return true;
		},
		is_in_moving_things: function (thing) {
			for (let i=0; i<this.ui.moving_things.length; i++) {
				if (this.ui.moving_things[i].id === thing.id) {
					return true;
				}
			}
			return false;
		},
		is_at_this_place: function (thing) {
			if (this.ui.place.name) {
				let place = this.ui.place;
				return this.places[place.id].things.hasOwnProperty(thing.id);
			}
		},
	},
});
Vue.component("app-move-things-to-place", Move_Things_To_Place);


/**** things ****/

let Thing = Vue.extend({
	template: "#thing_template",
	data: store.get_data,
	created: function () {
		if (!this.user.username) {
			this.$router.go('/login');
		}
		this.ui.view_history = store.get_ui_default("view_history");
		this.ui.history_view_length = store.get_ui_default("history_view_length");
	},
	computed: {
		thing: function () {
			let result = store.get_thing(this.$route.params.thing_id);
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "THING_NOT_FOUND":
						error_message = "Thing could not be found."; 
						this.$router.go("/");
						break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				return result;
			}
		},
		place: function () {
			if (!this.$route.params.place_id) { return undefined; }
			let result = store.get_place(this.$route.params.place_id);
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "PLACE_NOT_FOUND":
						error_message = "Place could not be found.";
						this.$router.go("/");
						break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				return result;
			}
		},
	},
	methods: {
		open_edit_thing: function () {
			this.ui.thing = Object.assign({}, this.thing);
			this.ui.moving_to_place_id = this.thing.place.id;
			$("#delete_thing_confirm").collapse("hide");
			$("#edit_thing_modal").modal("show");
		},
		history_event_color_class: function (event) {
			switch (event.type) {
				case "THING_CREATED":
					return "list-group-item-info";
				case "THING_DETAIL_UPDATED":
				case "THING_DETAIL_ADDED":
				case "THING_DETAIL_REMOVED":
					return "list-group-item-warning";
				case "THING_MOVED":
					return "list-group-item-success";
			}
		},
		history_event_heading: function (event) {
			let title = "";
			switch (event.name) {
				case "brand": title = "Brand"; break;
				case "type": title = "Type"; break;
				case "serial": title = "Serial ID"; break;
				case "model": title = "Model ID"; break;
				case "tracking": title = "Tracking ID"; break;
			}
			switch (event.type) {
				case "THING_CREATED":
					return `<i class="fa fa-briefcase" aria-hidden="true"></i> &nbsp; ${event.thing.brand} ${event.thing.type} created`;
				case "THING_DETAIL_UPDATED":
				case "THING_DETAIL_ADDED":
				case "THING_DETAIL_REMOVED":
					return `<i class="fa fa-pencil" aria-hidden="true" aria-label="Detail Change"></i> &nbsp; ${title}`;
				case "THING_MOVED":
					return `<i class="fa fa-arrow-right" aria-hidden="true" aria-label="Moved"></i> &nbsp; Moved`;
				default:
					return `Unknown Event Occurred`;
			}
		},
		history_event_body: function (event) {
			switch (event.type) {
				case "THING_DETAIL_UPDATED":
					return `<strong>${event.from}</strong> to <strong>${event.to}</strong>`;
				case "THING_DETAIL_ADDED":
					return `added <strong>${event.val}</strong>`;
				case "THING_DETAIL_REMOVED":
					return `removed <strong>${event.val}</strong>`;
				case "THING_MOVED":
					return `from <a href="#!/places/${event.from.id}"><strong>${event.from.name}</strong></a> to <a href="#!/places/${event.to.id}"><strong>${event.to.name}</strong></a>`;
			}
		},
	}
});

let Things = Vue.extend({
	template: "#things_template",
	data: store.get_data,
	created: function () {
		if (!this.user.username) {
			this.$router.go('/login');
		}
		this.ui.all_places_view_length = store.get_ui_default("all_places_view_length");
		this.ui.things_filter = "";
	},
	computed: {
		matching_things: function () {
			let matches = [];
			for (let thing_id in this.things) {
				if (this.things.hasOwnProperty(thing_id)) {
					let thing = this.things[thing_id];
					if (this.matches_things_filter(thing)) {
						matches.push(thing);
					}
				}
			}
			return matches;
		}
	},
	methods: {
		open_add_thing: function () {
			this.ui.thing = {};
			this.ui.moving_to_place_id = "";
			$("#add_thing_modal").modal("show");
		},
		matches_things_filter: function (thing) {
			// extract the filters
			let filters = this.ui.things_filter.split(" ");
			// if we have no filters, show everything
			if (filters.length === 1 && filters[0] === "") {
				return true;
			}
			// go through filters and find matches
			for (let i=0; i<filters.length; i++) {
				let filter = filters[i].toLowerCase().replace(/-|\(|\)|\./g,"");
				if (filter === "") { continue; }
				if (thing.brand.toLowerCase().indexOf(filter) === -1 &&
					thing.type.toLowerCase().indexOf(filter) === -1 &&
					thing.tracking.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.serial.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1 &&
					thing.model.toLowerCase().replace(/ |-|\(|\)|\./g,"").indexOf(filter) === -1) {
					return false;
				}
			}
			return true;
		},
	}
});

let Things_Datalists = Vue.extend({
	template: "#things_datalists_template",
	data: store.get_data,
	computed: {
		brands: function () {
			let brands_obj = {};
			let brands_list = [];
			for (let i=0; i<this.things.length; i++) {
				let brand = this.things[i].brand;
				if (!brands_obj.hasOwnProperty(brand)) {
					brands_obj[brand] = true;
					brands_list.push(brand);
				}
			}
			return brands_list;
		},
		types: function () {
			let types_obj = {};
			let types_list = [];
			for (let i=0; i<this.things.length; i++) {
				let type = this.things[i].type;
				if (!types_obj.hasOwnProperty(type)) {
					types_obj[type] = true;
					types_list.push(type);
				}
			}
			return types_list;
		},
	},
});
Vue.component("app-things-datalists", Things_Datalists);

let Add_Thing = Vue.extend({
	template: "#add_thing_template",
	data: store.get_data,
	methods: {
		create_thing: function () {
			let result = store.create_thing();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_TRACKING_ID":
						error_message = "A tracking id is required."; break;
					case "MISSING_SERIAL_ID":
						error_message = "A serial id is required."; break;
					case "MISSING_MODEL_ID":
						error_message = "A model id is required."; break;
					case "MISSING_BRAND":
						error_message = "A brand is required."; break;
					case "MISSING_TYPE":
						error_message = "A type is required."; break;
					case "MISSING_PLACE":
						error_message = "A place is required."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.brand} ${result.type} was successfully created.`);
				$("#add_thing_modal").modal("hide");
				this.$router.go(`/things/${result.id}`);
			}
		},
	},
});
Vue.component("app-add-thing", Add_Thing);

let Edit_Thing = Vue.extend({
	template: "#edit_thing_template",
	data: store.get_data,
	methods: {
		edit_thing: function () {
			let result = store.update_thing();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "MISSING_TRACKING_ID":
						error_message = "A tracking id is required."; break;
					case "MISSING_SERIAL_ID":
						error_message = "A serial id is required."; break;
					case "MISSING_MODEL_ID":
						error_message = "A model id is required."; break;
					case "MISSING_BRAND":
						error_message = "A brand is required."; break;
					case "MISSING_TYPE":
						error_message = "A type is required."; break;
					case "MISSING_PLACE":
						error_message = "A place is required."; break;
					case "PLACE_NOT_FOUND":
						error_message = "Place could not be found."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.brand} ${result.type} was successfully updated.`);
				$("#edit_thing_modal").modal("hide");
				if (this.$route.name === "thing of place") {
					this.$router.go(`/places/${result.place.id}/things/${result.id}`);
				}
			}
		},
		delete_thing: function () {
			let result = store.remove_thing();
			if (result.error === true) {
				let error_message = "An error has occurred.";
				switch (result.type) {
					case "THING_NOT_FOUND":
						error_message = "Thing could not be found."; break;
				}
				store.do_alert("danger", "Error", error_message);
			}
			else {
				store.do_alert("success", "Success", `${result.brand} ${result.type} was successfully removed.`);
				$("#edit_thing_modal").modal("hide");
				this.$router.go("/places/");
			}
		},
	},
});
Vue.component("app-edit-thing", Edit_Thing);


/**** app ****/

let App = Vue.extend({
	ready: function () {
		store.initialize();
	}
});

/**** router ****/

let router = new VueRouter();

router.map({
	"/login": {
		name: "login",
		group: "login",
		component: Login
	},
	"/start": {
		name: "start",
		group: "start",
		component: Start
	},
	"/places": {
		name: "places",
		group: "places",
		component: Places
	},
	"/places/:place_id": {
		name: "place",
		group: "places",
		component: Place
	},
	"/places/:place_id/things/:thing_id": {
		name: "thing of place",
		group: "places",
		component: Thing
	},
	"/things": {
		name: "things",
		group: "things",
		component: Things
	},
	"/things/:thing_id": {
		name: "thing",
		group: "things",
		component: Thing
	},
});

router.redirect({
	"/home": "/things",
	"*": "/home"
})

router.start(App, "#app");
