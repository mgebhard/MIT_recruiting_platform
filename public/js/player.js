 /**
  * Author: Megan Gebhard
  * This object represents a recruit profile.
  */

 var Profile = function(cellid, firstName, lastName, rank, position) {
   ////////////////////////////////////////////////
   // Representation
   //
   this.position = position;
   this.lastName = lastName;
   this.firstName = firstName;
   this.cellid = cellid;

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


 var compare = function(a, b) {
   if (a.rank < b.rank)
     return -1;
   if (a.rank > b.rank)
     return 1;
   return 0;
 };


 var TIM_ID = "ID1";
 var STEVIE_ID = "ID12";

 // Initialize ID to player object
 var PLAYERS = {
   "ID0": new Profile("ID0", "Rich", "Froning", 1, "DB"),
   "ID1": new Profile("ID1", "Tim", "Roberts", 2, "QB"),
   "ID2": new Profile("ID2", "Jim", "Brown", 3, "WR"),
   "ID3": new Profile("ID3", "Dave", "Adams", 4, "FB"),
   "ID4": new Profile("ID4", "John", "Hancock", 5, "TE"),
   "ID5": new Profile("ID5", "Sam", "Johnson", 6, "OL"),
   "ID6": new Profile("ID6", "Alex", "Carrera", 7, "DB"),
   "ID7": new Profile("ID7", "Raul", "Enrique", 8, "LT"),
   "ID8": new Profile("ID8", "Joe", "Rogers", 9, "WR"),
   "ID9": new Profile("ID9", "Steven", "Smith", 10, "TE"),
   "ID10": new Profile("ID10", "Randy", "Jackson", 11, "QB"),
   "ID11": new Profile("ID11", "Simon", "Cowell", 12, "RB"),
   "ID12": new Profile("ID12", "Stevie", "Curry", 13, "WR"),
   "ID13": new Profile("ID13", "Dwayne", "Wade", 14, "OL"),
   "ID14": new Profile("ID14", "Larry", "James", 15, "QB")
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

 var getSortedPlayers = function() {
   players_sorted = [];
   for (var key in PLAYERS) {
     players_sorted.push(PLAYERS[key]);
   }
   players_sorted.sort(compare);
   return players_sorted;
 };


 $('table').on('mouseup', function(evt) {


   setTimeout(function() {
     var x = $("#rankingTable tr");
     // HACK if size of array smaller than all players return from event handler
     if (x.length - 1 < Object.keys(PLAYERS).length) {
       return;
     }
     var y = $("#rankingTable th");

     for (i = 1; i < x.length; i++) {
       var rankCell = y[i + 4];
       var newRank = x[i].rowIndex;
       y[i + 4].innerHTML = newRank;
       PLAYERS[rankCell.id].rank = newRank;
     }
     setProfileRanks();
     window.localStorage.setItem("players", JSON.stringify(PLAYERS));
   }, 10);
 });

 var setProfileRanks = function() {
   var TimProfileRank = $("#TimRank");
   var TimTableRank = $('#' + TIM_ID);
   TimProfileRank.html(" " + TimTableRank.html());
   // Sets the "model" so it can save to persistant storage.
   PLAYERS[TIM_ID].rank = TimTableRank.html();


   var StevieProfileRank = $("#StevieRank");
   var StevieTableRank = $('#' + STEVIE_ID);
   StevieProfileRank.html(" " + StevieTableRank.html());
   PLAYERS[STEVIE_ID].rank = StevieTableRank.html();
 };

 String.prototype.format = function() {
   var args = [].slice.call(arguments);
   return this.replace(/(\{\d+\})/g, function(a) {
     return args[+(a.substr(1, a.length - 2)) || 0];
   });
 };

 var addPlayerRow = function(player) {
   var newRowContent = $('<tr> <td><span class="glyphicon glyphicon-menu-hamburger"></span></td> <th scope="row" id="{0}">{1}</th> <td class="firstName">{2}</td> <td class="lastName">{3}</td> <td class="position">{4}</td> </tr>'.format(player.cellid, player.rank, player.firstName, player.lastName, player.position));
   newRowContent.click(clickHandler);
   $("#sortable1").append(newRowContent);

 };

 var clickHandler = function() {
   console.log("Click handler");
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
 };

 $(document).ready(function() {
   // window.localStorage.setItem("players", JSON.stringify(PLAYERS));
   var savedPlayers = JSON.parse(window.localStorage.getItem("players"));
   if (savedPlayers) {
     PLAYERS = savedPlayers;
   }

   // Dynamically add the players
   sorted_players = getSortedPlayers();
   for (var playerIndex in sorted_players) {
     addPlayerRow(sorted_players[playerIndex]);
   }

   setProfileRanks();

   // Resize left col based on height of screen
   $('#leftMainColumn').height($(window).height() - 50);

   // Search Functionality currently only works once and requires 
   $('#searchButton').on("click", function(event) {
     event.preventDefault();
     var searchTerm = $('#searchInput').val();
     $('#searchInput').val("");
     if (searchTerm === "") {
       $("#sortable1").sortable('enable');
     } else {
       $("#sortable1").sortable('disable');
     }
     $("tbody tr").remove();

     sorted_players = getSortedPlayers();
     for (var playerId in sorted_players) {
       var player = sorted_players[playerId];
       console.log(player.firstName);
       if (searchTerm === "" ||
         searchTerm == player.firstName ||
         searchTerm == player.lastName ||
         searchTerm == player.position ||
         searchTerm == player.toString()) {
         addPlayerRow(player);
       }

     }
   });

   $("#rankingTable tr").click(clickHandler);
 });