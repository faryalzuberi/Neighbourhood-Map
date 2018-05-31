var map;
var infoWindow;

//initial array of location objects used to populate the View Model
var locations = [
        {
          title: "Zamzama Park", 
          location: {lat: 24.8148464, lng: 67.03839259999999}
        }, 
        {
          title: "Dolmen Mall", 
          location: {lat: 24.8019841, lng: 67.0294016}
        },
        {
          title: "Mohatta Palace", 
          location: {lat: 24.8142361, lng: 67.0329929}
        },
        {
          title: "Cafe Flo", 
          location: {lat: 24.8074805, lng: 67.0340473}
        },
        {
          title: "Dunkin Donuts", 
          location: { lat: 24.8103812, lng: 67.0701442}
        },
        {
          title: "Nixor College", 
          location: {lat: 24.803999, lng: 67.05872049999999}
        },
        {
          title: "Frere Hall", 
          location: {lat : 24.8475152, lng: 67.03304179999999}
        },
        {
          title: "The Forum", 
          location: {lat: 24.827207, lng: 67.037798}
        },
        {
          title: "Nisar Shaheed Park", 
          location: {lat: 24.8267288, lng: 67.0620502}
        },
        { title: "Espresso",
          location: {lat: 24.808176, lng: 67.061486}
        }];

var locationModel = function(location) { 
  var self = this;
  this.title = ko.observable(location.title);
  this.name = ko.observable("");
  this.location = ko.observable(location.location);
  //not a knockout observable
    this.marker = new google.maps.Marker({
          position: this.location(),
          map: map,
          animation: google.maps.Animation.DROP,
          title: this.title()
          });
    this.photo = ko.observable("");
    this.address = ko.observable("");
    //since the marker is not a knockout observable
    //the click events are handled via listener functions
    this.marker.addListener('click', function() {
      if(infoWindow.marker != null){
        //check if the info window is already attached
        //to a different marker
        if(infoWindow.marker != self.marker) {  
        //remove animation from previous marker 
            infoWindow.marker.setAnimation(null);
          }
      }
      //set the current marker to info window
      infoWindow.marker = self.marker;
      //handle close clicks
        infoWindow.addListener('closeclick', function() {
        infoWindow.marker.setAnimation(null);
      });

        //if no photo was returned from the foursquare api
        //then alert the user otherwise display the info
      if(self.photo() != ""){
        infoWindow.setContent("<h2><b>" + self.title() + "</b></h2><p>Source: Foursquare Places API</p><p>" + self.address() + "</p><img src='" + self.photo() + "' class='info-image'/>");
      }
      else {
        infoWindow.setContent("Details could not be fetched for given location!");
      }
        infoWindow.marker.setAnimation(google.maps.Animation.BOUNCE);
        infoWindow.open(map, self.marker);
    });

    //foursquare api call to search nearby locations for given lat long
    this.getFourSquareAPIResponse = function() {
      var baseUrl = 'https://api.foursquare.com/v2/venues/search?client_id=RFGFQ4KLUYUS0IDPPIBSBDDPPIGBF4040QTOXDLG43VCBW1H&client_secret=HRNN4DYPZBPH2AE53TL0JBZZL5TF0GGRBOM0M31QROSOIOQU&v=20180530';
      latlngString = self.location().lat + ','+ self.location().lng;
      
      $.ajax({ cache: false,
          url: baseUrl,
          data: { 'll': latlngString }
      }).done(function (data) {
          //call next function to extract venue id
            self.getVenueIds(data);
      }).fail(function (jqXHR, textStatus) {
          alert("Failed to load from Foursquare API. Error: " + textStatus);
      });
    }

  //function to extract the relevant venue and its id from the array returned
  //by the previous api call
  this.getVenueIds = function(data) {
    //default venue object is the first one in API response array
      var venueObject = data.response.venues[0];
      var venueArray = data.response.venues;
      venueArray.forEach(function(venue) {
        //if the venue name matches our title
        //then exit loop and extract id and address
        //as needed
        if(venue.name == self.title()) {
            venueObject = venue;
            return;
          }
      });
      self.name(venueObject.name);
      //not all venue objects return will have an address field
      if(venueObject.location.address != undefined){
      self.address(venueObject.location.address);
      }
      //next api call to fetch photos for the given venue 
      //using the id extracted from the previous api call
      self.getVenuePhotos(venueObject.id, location);
  }

  //get the first photograph of the venue
  this.getVenuePhotos = function(id) {
          var baseUrl = 'https://api.foursquare.com/v2/venues/' + id + '/photos?client_id=RFGFQ4KLUYUS0IDPPIBSBDDPPIGBF4040QTOXDLG43VCBW1H&client_secret=HRNN4DYPZBPH2AE53TL0JBZZL5TF0GGRBOM0M31QROSOIOQU&v=20180530';
          $.ajax({ cache: false,
              url: baseUrl,
          }).done(function (data) {
              self.photo(data.response.photos.items[0].prefix + 'original' + data.response.photos.items[0].suffix);
          }).fail(function (jqXHR, textStatus) {
              alert("Failed to load from Foursquare API. Error: " + textStatus);
          });

      }
     //call the api functions 
     self.getFourSquareAPIResponse();

}

//callback function to load map and initialize info window
function initMap(){
     map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 24.813383, lng: 67.0500333},
          zoom: 13
        });
         
      infoWindow = new google.maps.InfoWindow();
      infoWindow.marker = null; 
}

function onMapError() {
  alert("Failed to load Map from Google Maps API");
}

//toggle menu visibility whenever the menu icon is clicked
function toggleMenu(){
    document.getElementById("side-nav").classList.toggle('menu-visible');
}  
$(function(){
   $(window).on('load', function() { 
    var ViewModel = function() {
    
    var self = this;

    self.locationsObservableArray = ko.observableArray([]);

    self.query = ko.observable('');

    self.filterLocations = ko.computed(function() {
      //remove all markers
        ko.utils.arrayForEach(self.locationsObservableArray(), function(location) {
          location.marker.setMap(null);
        });
       //empty the list
       self.locationsObservableArray([]);
       locations.forEach(function(location){ 
            //if the search word entered by the user
            //does not match the current item in our observable array
            //then remove the marker and item
            var title = location.title.toLowerCase();
            var query = self.query().toLowerCase();
            if(title.indexOf(query) !== -1){
                  self.locationsObservableArray.push(new locationModel(location));
                }    
        }); 
        //add markers
        ko.utils.arrayForEach(self.locationsObservableArray(), function(location) {
          location.marker.setMap(map);
        });
        return self.locationsObservableArray();
    }); 

    //called whenever a list item is clicked in the view
      self.showInfoWindow = function(location) {
          if(infoWindow.marker != null){
          if(infoWindow.marker != location.marker) {  
            //remove animation from previous marker 
              console.log(infoWindow.marker);
                infoWindow.marker.setAnimation(null);
            }
          }
          infoWindow.marker = location.marker;
          //remove animation if the info window is closed by the user
          infoWindow.addListener('closeclick', function() {
            infoWindow.marker.setAnimation(null);
          });
          if(location.photo() != ""){
            infoWindow.setContent("<h2><b>" + location.title() + "</b></h2><p>Source: Foursquare Places API</p>" + location.address() + "</p><img src='" + location.photo() + "' class='info-image'/>");  
          }
          else {
            infoWindow.setContent("Details could not be fetched for given location!");
          }
          location.marker.setAnimation(google.maps.Animation.BOUNCE);
          infoWindow.open(map, location.marker);
    }

      self.removeAllMarkers = function(){
        ko.utils.arrayForEach(self.locationsObservableArray(), function(location) {
        location.marker.setMap(null);
        });
      }

      self.addMarkers = function() {
        ko.utils.arrayForEach(self.locationsObservableArray(), function(location) {
        location.marker.setMap(map);
        });
      }   
      
}

ko.applyBindings(new ViewModel());
  });
});
