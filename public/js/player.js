 /**
  * Author: Megan Gebhard
  * This object represents a recruit profile.
  */
 // window.localStorage.setItem("meta", JSON.stringify(meta));
 // var meta1 = JSON.parse(window.localStorage.getItem("meta"));
 // alert(meta1['foo']);
 var Profile = function(firstName, lastName, rank, position) {
   ////////////////////////////////////////////////
   // Representation
   //

   // Two immutable properties
   Object.defineProperty(this, 'firstName', {
     value: firstName,
     writable: false
   });
   Object.defineProperty(this, 'lastName', {
     value: lastName,
     writable: false
   });
   Object.defineProperty(this, 'position', {
     value: position,
     writable: false
   });

   // Two mutable properties
   this.rank = rank;

   ////////////////////////////////////////////////
   // Public methods
   //
   this.toString = function() {
     var name = this.firstName + " " + this.lastName;
     return name;
   };
 };

 var TIM_ID = 1;
 var STEVIE_ID = 12;

 // Initialize ID to player object
 var PLAYERS = {
   0: new Profile("Rich", "Froning", 1, "DB"),
   1: new Profile("Tim", "Roberts", 2, "QB"),
   2: new Profile("Jim", "Brown", 3, "WR"),
   3: new Profile("Dave", "Adams", 4, "FB"),
   4: new Profile("John", "Hancock", 5, "TE"),
   5: new Profile("Sam", "Johnson", 6, "OL"),
   6: new Profile("Alex", "Carrera", 7, "DB"),
   7: new Profile("Raul", "Enrique", 8, "LT"),
   8: new Profile("Joe", "Rogers", 9, "WR"),
   9: new Profile("Steven", "Smith", 10, "TE"),
   10: new Profile("Randy", "Jackson", 11, "QB"),
   11: new Profile("Simon", "Cowell", 12, "RB"),
   12: new Profile("Stevie", "Curry", 13, "WR"),
   13: new Profile("Dwayne", "Wade", 14, "OL"),
   14: new Profile("Larry", "James", 15, "QB")
 };


 var fixHelper = function(e, ui) {
   ui.children().each(function() {
     $(this).width($(this).width());
   });
   return ui;
 };
 $(function() {
   $("#sortable1").sortable({
     helper: fixHelper
   }).disableSelection();
 });


 $('table').on('mouseup', function(evt) {
   setTimeout(function() {
     var x = $("#rankingTable tr");
     var y = $("#rankingTable th");
     for (i = 1; i < x.length; i++) {
       y[i + 4].innerHTML = x[i].rowIndex;
     }

     var TimProfileRank = $("#TimRank");
     var TimTableRank = $(("#ID{0}".format(TIM_ID)));
     TimProfileRank.html(" " + TimTableRank.html());


     var StevieProfileRank = $("#StevieRank");
     var StevieTableRank = $("#ID{0}".format(STEVIE_ID));
     StevieProfileRank.html(" " + StevieTableRank.html());
   }, 10);
 });

 String.prototype.format = function() {
   var args = [].slice.call(arguments);
   return this.replace(/(\{\d+\})/g, function(a) {
     return args[+(a.substr(1, a.length - 2)) || 0];
   });
 };

 var addPlayerRow = function(player) {
   var newRowContent = '<tr> <td><span class="glyphicon glyphicon-menu-hamburger"></span></td> <th scope="row" id="ID{0}">{0}</th> <td class="firstName">{1}</td> <td class="lastName">{2}</td> <td class="position">{3}</td> </tr>'.format(player.rank, player.firstName, player.lastName, player.position);
   $("#sortable1").append(newRowContent);

 };

 $(document).ready(function() {
   // Resize left col based on height of screen
   $('#leftMainColumn').height($(window).height() - 50);

   // Search Functionality currently only works once and requires 
   $('#searchButton').on("click", function(event) {
     event.preventDefault();
     var searchTerm = $('#searchInput').val();
     $('#searchInput').val("");

     $("tbody tr").remove();


     for (var playerId in PLAYERS) {
       var player = PLAYERS[playerId];
       console.log(player.firstName);
       if (searchTerm == player.firstName ||
         searchTerm == player.lastName ||
         searchTerm == player.position) {
         addPlayerRow(player);

       }

     }

   });


   // Dynamically add the players
   for (var playerIndex in PLAYERS) {
     var player = PLAYERS[playerIndex];
     addPlayerRow(player);
   }

   $("#rankingTable tr").click(function() {
     $(this).addClass('active').siblings().removeClass('active');
     var cells = this.getElementsByTagName("td");
     timProf = document.getElementById("TimProfile");
     stevieProf = document.getElementById("StevieProfile");

     if (cells[1].innerHTML == "Stevie") {
       stevieProf.style.display = "inline-block";
       timProf.style.display = "none";
     } else if (cells[1].innerHTML == "Tim") {
       stevieProf.style.display = "none";
       timProf.style.display = "inline-block";
     }
   });
 });