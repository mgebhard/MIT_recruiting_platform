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

 // Initialize ID to player object
 var PLAYERS = {
   1: new Profile("Rich", "Froning", 1, "DB"),
   2: new Profile("Tim", "Roberts", 2, "QB"),
   3: new Profile("Jim", "Brown", 3, "WR"),
   4: new Profile("Dave", "Adams", 4, "FB"),
   5: new Profile("John", "Hancock", 5, "TE"),
   6: new Profile("Sam", "Johnson", 6, "OL"),
   7: new Profile("Alex", "Carrera", 7, "DB"),
   8: new Profile("Raul", "Enrique", 8, "LT"),
   9: new Profile("Joe", "Rogers", 9, "WR"),
   10: new Profile("Steven", "Smith", 10, "TE"),
   11: new Profile("Randy", "Jackson", 11, "QB"),
   12: new Profile("Simon", "Cowell", 12, "RB"),
   13: new Profile("Stevie", "Curry", 13, "WR"),
   14: new Profile("Dwayne", "Wade", 14, "OL"),
   15: new Profile("Larry", "James", 15, "QB")
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


 $("tr").on('mouseup', function(evt) {
   setTimeout(function() {
     var rankingTable = document.getElementById("rankingTable");
     var x = rankingTable.getElementsByTagName("tr");
     var y = rankingTable.getElementsByTagName("th");
     for (i = 1; i < x.length; i++) {
       y[i + 4].innerHTML = x[i].rowIndex;
     }

     var TimRank = document.getElementById("TimRank");
     var TimOtherRank = document.getElementById("TimOtherRank");
     TimRank.innerHTML = " " + TimOtherRank.innerHTML;
     var StevieRank = document.getElementById("StevieRank");
     var StevieOtherRank = document.getElementById("StevieOtherRank");
     StevieRank.innerHTML = " " + StevieOtherRank.innerHTML;
   }, 10);
 });

 String.prototype.format = function() {
   var args = [].slice.call(arguments);
   return this.replace(/(\{\d+\})/g, function(a) {
     return args[+(a.substr(1, a.length - 2)) || 0];
   });
 };

 $(document).ready(function() {
   $('#leftMainColumn').height($(window).height() - 50);
   $('#searchButton').click(function() {
     var searchTerm = $('#searchInput').val();
     $('#searchInput').val("");
     var firstName = $(".firstName");
     var lastName = $(".lastName");
     var position = $(".position");
     console.log(searchTerm);
     for (index = 0; index < firstName.length; index++) {
       var firstNameTD = firstName[index];
       var lastNameTD = lastName[index];
       var positionTD = position[index];
       if (searchTerm == firstNameTD.innerHTML ||
        searchTerm == lastNameTD.innerHTML ||
        searchTerm == positionTD.innerHTML) {
        continue;
       } else {
         $(firstNameTD).parent().remove();
       }
     }

   });


   // Dynamically add the players
   // for (var playerIndex in PLAYERS) {
   //  var player = PLAYERS[playerIndex];
   //  console.log(player);
   //   var newRowContent = '<tr> <td><span class="glyphicon glyphicon-menu-hamburger"></span></td> <th scope="row" id="Ranks{0}">{0}</th> <td>{1}</td> <td>{2}</td> <td>{3}</td> </tr>'.format(player.rank, player.firstName, player.lastName, player.position);
   //   $("#sortable1").append(newRowContent);
   // }

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