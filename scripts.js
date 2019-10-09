var weapons, weapNum, categoryChanged, comparisonsOn;
	
/** function onPageLoad()
 * Function to be run on first page load
 * @returns : Nothing
 */
function onPageLoad() {
	categoryChanged = true;
	var weapTemp, xmlhttp, xmlDoc, issuehttp, issueDoc;
	
	if(window.XMLHttpRequest) { // For IE7+, Firefox, Chrome, Opera, & Safari
		xmlhttp = new XMLHttpRequest();
		issuehttp = new XMLHttpRequest();
	}
	else { // For IE6, IE5 (ishygddt)
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		issuehttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	
	xmlhttp.onreadystatechange = function (err) {
		if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			console.log("MordStats.xml loaded successfully.");
			xmlDoc = xmlhttp.responseXML;
			
			// Set global variable for number of weapons
			try {
				weapTemp = xmlDoc.getElementsByTagName("Weapon");
				weapNum = weapTemp.length;
			} catch (err) {
				alert("An error occurred parsing XML file");
				return;
			}
			
			if (weapNum == null) {
				alert("An unknown error occurred with XML file.");
			} else {
				// Full success opening and parsing XML file.  Continue with script.
				weapons = [].slice.call(weapTemp); // Convert DOM NodeList into array so it can be sorted
				weapons.sort(nameCompare);
				populateLists("Melee");
			}
		} else if (xmlhttp.readyState === 3 && xmlhttp.status === 404) {
			alert("Error opening XML file for reading.");
		}
	};
	
	xmlhttp.onerror = function (err) {
		console.error(xmlhttp.statusText);
		alert("Unknown error occurred with XML file.");
	};
	
	xmlhttp.open("GET","res/MordStats.xml");
	xmlhttp.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
	xmlhttp.setRequestHeader('cache-control', 'max-age=0');
	xmlhttp.setRequestHeader('expires', '0');
	xmlhttp.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
	xmlhttp.setRequestHeader('pragma', 'no-cache');
	xmlhttp.send();
	
	issuehttp.onreadystatechange = function (err) {
		if (issuehttp.readyState === 4 && xmlhttp.status === 200) {
			console.log("KnownIssues.txt loaded successfully.");
			issueDoc = issuehttp.responseText;
			
			try {
				fillIssues(issueDoc);
			} catch (err) {
				alert("An error occurred while reading the known issues file");
				return;
			}
		} else if (xmlhttp.readyState === 3 && xmlhttp.status === 404) {
			alert("An error occurred opening the known issues file for reading.");
		}
	};
	
	issuehttp.onerror = function (err) {
		console.error(issuehttp.statusText);
		alert("Unknown error occurred with known issues file.");
	};
	
	issuehttp.open("GET","res/KnownIssues.txt");
	issuehttp.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
	issuehttp.setRequestHeader('cache-control', 'max-age=0');
	issuehttp.setRequestHeader('expires', '0');
	issuehttp.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
	issuehttp.setRequestHeader('pragma', 'no-cache');
	issuehttp.send();
}

/** function changeWeapon(newSelect)
 * Updates the weapon list to reflect the new weapon being selected, then calls updateStats
 * @param newSelect : The listOption element that was selected
 * @returns : Nothing
 */
function changeWeapon(newSelect) {
	if (newSelect.classList.contains("currSelected")) {
		return;
	}

	var side = getElementSide(newSelect);
	var weaponListElem = newSelect.parentNode.parentNode;
	var listSelElem = weaponListElem.getElementsByClassName("listSelected")[0];
	var currSelElem = weaponListElem.getElementsByClassName("currSelected")[0];
	
	listSelElem.getElementsByClassName("optionText")[0].innerHTML = newSelect.getElementsByClassName("optionText")[0].innerHTML;
	currSelElem.classList.remove("currSelected");
	newSelect.classList.add("currSelected");

	setTypeOptions(side, listSelElem.getElementsByClassName("optionText")[0].innerHTML);
	updateStats(side, listSelElem.getElementsByClassName("optionText")[0].innerHTML);
}

/** function cleanNumber(input)
 * Takes a String containing a positive integer and cleans any non-numerical characters off of it
 * @param input : The input; must be positive and whole integer
 * @returns : The number, still as a String (probably, JavaScript is a little odd)
 */
function cleanNumber(input) {
	var output = "";
	for (cn=0; cn<input.length; cn++) {
		if (isNumber(input.charAt(cn))) {
			output += input.charAt(cn);
		}
	}
	
	if (output == "") {
		alert("Error 3: String does not contain a number");
		return -1;
	}
	return output;
}

/** function clearTables(side)
 * Clears existing values from damage, speed, and general stat tables for provided side
 * -=-= Will need to hide table elements for speed and/or general stats if other side has no (or N/A) value =-=-
 * @param side : The side to clear the tables for
 * @returns : Nothing
 */
function clearTables(side) {
	// Clear damage table
	var damageValues = document.getElementById("damageTable").getElementsByClassName("damageValue");
	var s = side.charAt(0);
	
	for (i=0; i<damageValues.length; i++) {
		if (damageValues[i].id.charAt(damageValues[i].id.length-1) == s) {
			damageValues[i].innerHTML = "";
			damageValues[i].setAttribute("class", "damageValue posCorr");
			damageValues[i].parentNode.setAttribute("class", "damageDiv");
		}
	}
	
	// Clear speed table
	var speedValues = document.getElementsByClassName("speedValue");
	for (i=0; i<speedValues.length; i++) {
		if (speedValues[i].id.includes(side)) {
			speedValues[i].innerHTML = "";
		}
	}
	
	// Clear general stats
	var genStats = document.getElementsByClassName("genStat");
	for (i=0; i<genStats.length; i++) {
		if (genStats[i].id.charAt(genStats[i].id.length-1) == s) {
			genStats[i].innerHTML = "";
		}
	}
}

/** function closeMenus()
 * Closes menus and lists
 * @returns : Nothing
 */
function closeMenus() {
	var lists = document.getElementsByClassName("listItems");
	var dummies = document.getElementsByClassName("dummyList");
	for (i=0; i<lists.length; i++) {
		lists[i].classList.add("menuHide");
		dummies[i].classList.add("menuHide");
	}
	
	var menus = document.getElementsByClassName("menu");
	for (i=0; i<menus.length; i++) {
		menus[i].classList.add("menuHide");
	}
}

/** function compare() {
 * Calculates the comparisons between most stats and alters the color of non-numerical stats that are different
 * @returns : Nothing
 */
function compare() {
	var compsL = document.getElementsByClassName("compL");
	var compsR = document.getElementsByClassName("compR");
	var textStats = document.getElementsByClassName("textStat");
	var dataL, dataR;
	
	// Make comparisons for numeric stats
	for (i=0; i<compsL.length; i++) {
		dataL = compsL[i].parentNode.children[0].innerHTML;
		dataR = compsR[i].parentNode.children[0].innerHTML;
		dataComps = new Array(compsL.length);
		if (isNumber(dataL) && isNumber(dataR)) {
			if (compsL[i].previousSibling.id.includes("GravityScale")) {
				// Because Javascript is weird and cant handle decimal subtraction properly
				dataComps[i] = (10*dataL - 10*dataR)/10;
			} else {
				dataComps[i] = dataL - dataR;
			}
		} else if (dataL.length > 2 && dataR.length > 2 &&
				isNumber(dataL.substring(0, dataL.length-2)) && isNumber(dataR.substring(0, dataR.length-2))) {
			// Check if it is a number without the last 2 characters which may be units ("ms" or "cm")
			dataComps[i] = dataL.substring(0, dataL.length-2) - dataR.substring(0, dataR.length-2);
		} else {
			dataComps[i] = "";
		}
		
		if (compsL[i].parentNode.parentNode.parentNode.children[0].id == "WoodDamage"
			|| compsL[i].parentNode.parentNode.parentNode.children[0].id == "Knockback") {
			compsL[i].previousSibling.classList.remove("posCorr", "neutCorr", "negCorr");
			compsR[i].previousSibling.classList.remove("posCorr", "neutCorr", "negCorr");
			if (dataL < 0 && dataR < 0) {
				compsL[i].previousSibling.classList.add("negCorr");
				compsR[i].previousSibling.classList.add("negCorr");
			} else if (dataL < 0 || dataR < 0) {
				compsL[i].previousSibling.classList.add("neutCorr");
				compsR[i].previousSibling.classList.add("neutCorr");
			} else {
				compsL[i].previousSibling.classList.add("posCorr");
				compsR[i].previousSibling.classList.add("posCorr");
			}
		}
		
		if (dataComps[i] > 0) {
			if (compsL[i].parentNode.children[0].classList.contains("posCorr")) {
				compsL[i].setAttribute("class", "compL cPos");
				compsR[i].setAttribute("class", "compR cNeg");
			} else if (compsL[i].parentNode.children[0].classList.contains("negCorr")) {
				compsL[i].setAttribute("class", "compL cNeg");
				compsR[i].setAttribute("class", "compR cPos");
			} else if (compsL[i].parentNode.children[0].classList.contains("neutCorr")) {
				compsL[i].setAttribute("class", "compL cNeut");
				compsR[i].setAttribute("class", "compR cNeut");
			}

			compsL[i].innerHTML = "(+" + dataComps[i] + ")";
			compsR[i].innerHTML = "(" + -dataComps[i] + ")";
		} else if (dataComps[i] < 0) {
			if (compsL[i].parentNode.children[0].classList.contains("posCorr")) {
				compsL[i].setAttribute("class", "compL cNeg");
				compsR[i].setAttribute("class", "compR cPos");
			} else if (compsL[i].parentNode.children[0].classList.contains("negCorr")) {
				compsL[i].setAttribute("class", "compL cPos");
				compsR[i].setAttribute("class", "compR cNeg");
			} else if (compsL[i].parentNode.children[0].classList.contains("neutCorr")) {
				compsL[i].setAttribute("class", "compL cNeut");
				compsR[i].setAttribute("class", "compR cNeut");
			}

			compsL[i].innerHTML = "(" + dataComps[i] + ")";
			compsR[i].innerHTML = "(+" + -dataComps[i] + ")";
		} else {
			// If no values or no difference between values, hide comparisons
			compsL[i].setAttribute("class", "compL cNone");
			compsR[i].setAttribute("class", "compR cNone");
		}
			
		if (compsL[i].previousSibling.classList.contains("speedValue")) {
			compsL[i].innerHTML = compsL[i].innerHTML.substring(0, compsL[i].innerHTML.length-1) + "ms)";
			compsR[i].innerHTML = compsR[i].innerHTML.substring(0, compsR[i].innerHTML.length-1) + "ms)";
		}
	}
	
	// Make comparisons for text-based stats (just "Yes" and "No" at this point)
	for (i=0; i<textStats.length; i+=2) {
		textStats[i].classList.remove("cPos", "cNeg", "cNeut");
		textStats[i+1].classList.remove("cPos", "cNeg", "cNeut");
		
		if ((textStats[i].innerHTML == "Yes" && textStats[i+1].innerHTML == "No")) {
			if (textStats[i].classList.contains("posCorr")) {
				textStats[i].classList.add("cPos");
				textStats[i+1].classList.add("cNeg");
			} else if (textStats[i].classList.contains("negCorr")) {
				textStats[i].classList.add("cNeg");
				textStats[i+1].classList.add("cPos");
			} else {
				textStats[i].classList.add("cNeut");
				textStats[i+1].classList.add("cNeut");
			}
		} else if (textStats[i].innerHTML == "No" && textStats[i+1].innerHTML == "Yes") {
			if (textStats[i].classList.contains("posCorr")) {
				textStats[i].classList.add("cNeg");
				textStats[i+1].classList.add("cPos");
			} else if (textStats[i].classList.contains("negCorr")) {
				textStats[i].classList.add("cPos");
				textStats[i+1].classList.add("cNeg");
			} else {
				textStats[i].classList.add("cNeut");
				textStats[i+1].classList.add("cNeut");
			}
		}
	}
}

/** function fillIssues(data)
 * Gets the known issues file and fills the corresponding panel with each one
 * @param data : The data from the known issues file
 * @returns : Nothing
 */

function fillIssues(data) {
	var issueList = document.getElementById("issuesMenu");
	var issues = data.split("-");
	var issueElem;
	
	for (is=1; is < issues.length; is++) {
		issueElem = document.createElement("div");
		issueElem.setAttribute("class", "issue");
		issueElem.innerHTML += ("- " + issues[is]);
		issueList.appendChild(issueElem);
	}
}

/** function getAttackType(side)
 * Gets the whole attack type for the provided side
 * @param side : The side
 * @returns : The attack type
 */
function getAttackType(side) {
	var attackTypeElem, attackType;
	attackTypeElem = document.getElementById("attType"+side);
	
	if (attackTypeElem.getElementsByClassName("altButton")[0].classList.contains("altSel")) {
		if (attackTypeElem.getElementsByClassName("attButton")[0].classList.contains("strikeSel")) {
			attackType = "Alt Strike";
		} else if (attackTypeElem.getElementsByClassName("attButton")[1].classList.contains("stabSel")) {
			attackType = "Alt Stab";
		} else {
			// If alt is selected but neither strike or stab is, that means it's a throwable melee weapon
			attackType = "Melee Throw";
		}
	} else {
		if (attackTypeElem.getElementsByClassName("attButton")[0].classList.contains("strikeSel")) {
			attackType = "Strike";
		} else if (attackTypeElem.getElementsByClassName("attButton")[1].classList.contains("stabSel")) {
			attackType = "Stab";
		} else {
			// If none of alt, strike, or stab are selected, that means it is a ranged weapon
			attackType = "Ranged";
		}
	}
	
	return attackType;
}

/** function getCategory()
 * Gets the name of the currently selected category
 * @returns : The name of the currently selected category
 */

function getCategory() {
	return document.getElementsByClassName("catActive")[0].innerHTML;
}

/** function getElementSide(elem)
 * Returns the side for the provided element, or "None" if it does not belong to one
 * @param elem : HTML document element
 * @returns : "Left", "Right", or "None"
 */
function getElementSide(elem) {
	var side = "None";
	
	while (elem.parentNode != null) {
		elem = elem.parentNode;
		if (elem.id != null && elem.id.includes("Left")) {
			return "Left";
		} else if (elem.id != null && elem.id.includes("Right")) {
			return "Right";
		}
	}
	
	return side;
}

/** function getNewDefault()
 * Selects a new default weapon based on the current category (and if peasant weapons are shown)
 * @returns : The XML data for the new weapon
 */
function getNewDefault() {
	var num;
	var cat = getCategory();
	if (document.getElementById("peasantBtn").classList.contains("checked")) {
		showPeasant = true;
	} else {
		showPeasant = false;
	}
	
	do {
		num = Math.floor(Math.random()*weapNum);
	} while (weapons[num].getElementsByTagName("Type")[0].childNodes[0].nodeValue != cat
			|| (!showPeasant && weapons[num].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes"));
	
	return weapons[num];
}

/** function getWeaponData(name)
 * Gets the data as an XML node for the requested weapon
 * @param name : The name of the weapon
 * @returns : The XML data node
 */
function getWeaponData(name) {
	for (i=0; i<weapons.length; i++) {
		if (weapons[i].getElementsByTagName("Name")[0].childNodes[0].nodeValue == name) {
			return(weapons[i]);
		}
	}
	
	alert("Weapon data for " + name + " could not be found.");
	return -1;
}

/** function isNumber(input)
 * Checks if a given variable (including Strings) is a number
 * @param input : The variable
 * @returns : True or False
 */
function isNumber(input) {
	if (input == "" || input == null) {
		return false;
	} else if (isNaN(input)) {
		return false;
	} else {
		return true;
	}
}

/** function makeLists()
 * Clears the listItems elements and appends the options to them based on selected sorting method and category
 * NOTE: Function assumes weapons XML file is sorted as it should be kept that way
 * @returns : The Div array
 */
function makeLists() {
	var category = document.getElementsByClassName("catActive")[0].innerHTML;
	var boxes = document.getElementById("sortButtons").getElementsByClassName("checkbox");
	var sortMethod;
	if (boxes[0].classList.contains("checked")) {
		sortMethod = "name";
	} else if (boxes[1].classList.contains("checked")) {
		sortMethod = "points";
	} else {
		alert("Error 4");
		return;
	}
	
	var showPeasant;
	if (document.getElementById("peasantBtn").classList.contains("checked")) {
		showPeasant = true;
	} else {
		showPeasant = false;
	}

	var options = new Array();
	var pointCosts = new Array();
	var weaponLists, weapName, pointCosts, optionElement, optionImg, optionText, selectedName;
	weaponLists = document.getElementsByClassName("weaponList");
	
	for (w=0; w<weapons.length; w++) {
		if (weapons[w].getElementsByTagName("Type")[0].childNodes[0].nodeValue != category) {
			continue;
		}
		if (!showPeasant && weapons[w].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
			continue;
		}
		
		// Create div for option, add image for point cost and name
		weapName = weapons[w].getElementsByTagName("Name")[0].childNodes[0].nodeValue;
		pointCost = weapons[w].getElementsByTagName("Points")[0].childNodes[0].nodeValue;
		optionElement = document.createElement("div");
		optionImg = document.createElement("div");
		optionImg.setAttribute("class", "optionImg");
		optionImg.style.backgroundImage = "url(\"img/icons/points"+pointCost+".png\")";
		optionText = document.createElement("span");
		optionText.setAttribute("class", "optionText");		
		optionText.innerHTML = weapName;
		optionElement.appendChild(optionImg);
		optionElement.appendChild(optionText);

		if (sortMethod == "points") {
			// Get point costs for each weapon, then push that element to the appropriate spot in the array.
			// XML file will be kept sorted by name so each sub-array will automatically be sorted by name
			pointCosts.push(pointCost);
		}
		options.push(optionElement);
	}
	

	var oldList, newList, oldDummy, newDummy;
	
	var selectedName;
	for (l=0; l<weaponLists.length; l++) {
		// Replace listItems/dummyList element with clone of itself lacking the old listOption elements,
		// then get the new listItems element
		// Dummies are for creating transparent backdrop because backdrop-filter isn't supported yet
		oldList = weaponLists[l].getElementsByClassName("listItems")[0];
		newList = oldList.cloneNode(false);
		oldDummy = weaponLists[l].getElementsByClassName("dummyList")[0];
		newDummy = oldDummy.cloneNode(false);
		weaponLists[l].replaceChild(newList, oldList);
		weaponLists[l].replaceChild(newDummy, oldDummy);
		
		selectedName = weaponLists[l].getElementsByClassName("optionText")[0].innerHTML;
		if (sortMethod == "points") {
			// Create 2D array: [point cost][weapon]
			var points;
			var buffer = new Array(11);
			for (a=0; a<11; a++) {
				buffer[a] = new Array();
			}
			
			// Get the point cost of each weapon, then push that weapon's element
			// to the corresponding array within the buffer array
			for (n=0; n<options.length; n++) {
				buffer[pointCosts[n]-1].push(options[n]);
			}
	
			// Append the sum of the buffer arrays to the listItems element
			for (x=0; x<11; x++) {
				for (y=0; y<buffer[x].length; y++) {
					if (l > 0) {
						// listOption must be cloned before being appended elsewhere
						buffer[x][y] = buffer[x][y].cloneNode(true);
					}
					
					if (buffer[x][y].getElementsByClassName("optionText")[0].innerHTML == selectedName) {
						buffer[x][y].setAttribute("class", "listOption currSelected")
					} else {
						buffer[x][y].setAttribute("class", "listOption");
					}
					
					// Add event listeners to update list and stats when clicked
					buffer[x][y].addEventListener("mouseup", function(){
						changeWeapon(this);
					});
					newList.appendChild(buffer[x][y]);
					dummyOption = buffer[x][y].cloneNode(true);
					dummyOption.setAttribute("class", "dummyOption");
					newDummy.appendChild(dummyOption);
				}
			}
		} else if (sortMethod == "name") {
			for (o=0; o<options.length; o++) {
				if (l > 0) {
					// listOption must be cloned before being appended elsewhere
					options[o] = options[o].cloneNode(true);
				}
				
				if (options[o].getElementsByClassName("optionText")[0].innerHTML == selectedName) {
					options[o].setAttribute("class", "listOption currSelected")
				} else {
					options[o].setAttribute("class", "listOption");
				}
				
				// Add event listeners to update list and stats when clicked
				options[o].addEventListener("mouseup", function(){
					changeWeapon(this);
				});
				newList.appendChild(options[o]);
				dummyOption = options[o].cloneNode(true);
				dummyOption.setAttribute("class", "dummyOption");
				newDummy.appendChild(dummyOption);
			}
			
		} else {
			alert("Error 6");
			return;
		}
	}
}

/** function nameCompare(a, b)
 * Function to be passed for sorting weapons array based on weapon names
 * @param a : Arg 1
 * @param b : Arg 2
 * @returns : -1, 1, or 0 based on comparison
 */
function nameCompare(a, b) {
	if (a.getElementsByTagName("Name")[0].childNodes[0].nodeValue < b.getElementsByTagName("Name")[0].childNodes[0].nodeValue) {
		return -1;
	} else if (a.getElementsByTagName("Name")[0].childNodes[0].nodeValue > b.getElementsByTagName("Name")[0].childNodes[0].nodeValue) {
		return 1;
	} else {
		return 0;
	}
}

/** function populateLists(cat)
 * Creates drop-down lists for equipment names (depending upon category)
 * @param cat : The category of equipment (Ranged, Melee, or Shield) to populate lists with
 * @returns : Nothing
 */
function populateLists(cat) {
	if (cat != "Melee" && cat != "Ranged" && cat != "Shield") {
		alert("Error: invalid category");
		return;
	}
	
	// Get page elements for weapon selections, then clear existing options (if any)
	var weaponLeftElem = document.getElementById("weaponLeft");
	var weaponRightElem = document.getElementById("weaponRight");
	
	// Randomly select XML node for 2 weapons of provided category
	var defaultLeftXML = getNewDefault();
	var defaultRightXML = getNewDefault();
	while (defaultLeftXML == defaultRightXML) {
		defaultRightXML = getNewDefault();
	}
	
	// Get attack types for each weapon and randomly select a number to be the default for each
	var attacksLeft = defaultLeftXML.getElementsByTagName("Attack");
	var attacksRight = defaultRightXML.getElementsByTagName("Attack");
	var defAttackLeft = Math.floor(Math.random()*attacksLeft.length);
	var defAttackRight = Math.floor(Math.random()*attacksRight.length);
	
	// Add default weapons to lists as the currently selected
	var defaultElemLeft, defaultElemRight,
	listElementLeft, listElementRight, optionElement, optionImg, optionText, dummyLists, dummyOption,
	weapName, pointCost;
	
	defaultElemLeft = document.createElement("div");
	defaultElemLeft.setAttribute("class", "listSelected");
	defaultElemRight = defaultElemLeft.cloneNode(true);
	
	optionText = document.createElement("span");
	optionText.setAttribute("class", "optionText");
	weapName = defaultLeftXML.getElementsByTagName("Name")[0].childNodes[0].nodeValue;
	optionText.innerHTML = weapName;
	defaultElemLeft.appendChild(optionText);

	optionText = optionText.cloneNode(false);
	weapName = defaultRightXML.getElementsByTagName("Name")[0].childNodes[0].nodeValue;
	optionText.innerHTML = weapName;
	defaultElemRight.appendChild(optionText);
	weaponLeftElem.replaceChild(defaultElemLeft, weaponLeftElem.getElementsByClassName("listSelected")[0]);
	weaponRightElem.replaceChild(defaultElemRight, weaponRightElem.getElementsByClassName("listSelected")[0]);
	
	makeLists();
	
	defaultElemLeft.addEventListener("click", toggleList);
	defaultElemRight.addEventListener("click", toggleList);
	
	// Add event listener to close all lists if user clicks anywhere outside a list
	document.addEventListener("click", closeMenus);
	
	// Update everything for new category and weapons
	categoryChanged = true;
	setTypeOptions("Left", defaultElemLeft.getElementsByClassName("optionText")[0].innerHTML);
	setTypeOptions("Right", defaultElemRight.getElementsByClassName("optionText")[0].innerHTML);
	updateStats("Left", defaultElemLeft.getElementsByClassName("optionText")[0].innerHTML);
	updateStats("Right", defaultElemRight.getElementsByClassName("optionText")[0].innerHTML);
}

/** function setHiddenElements()
 * Shows/hides speed and general stat elements based on what data is being displayed.
 * @returns : Nothing
 */
function setHiddenElements() {
	var speedRows = document.getElementById("speedTable").getElementsByTagName("tr");
	var speedValues;
	
	for (i=0; i<speedRows.length; i++) {
		speedValues = speedRows[i].getElementsByClassName("speedValue");
		
		if (!speedValues[0].classList.contains("emptyStat") || !speedValues[1].classList.contains("emptyStat")) {
			speedRows[i].classList.remove("invisible");
		} else {
			speedRows[i].classList.add("invisible");
		}
	}
	
	var genRows = document.getElementById("genTable").getElementsByTagName("tr");
	var genValues;
	
	for (i=1; i<genRows.length; i++) {
		genValues = genRows[i].getElementsByClassName("genStat");
		
		if (!genValues[0].classList.contains("emptyStat") || !genValues[1].classList.contains("emptyStat")) {
			genRows[i].hidden = false;
		} else {
			genRows[i].hidden = true;
		}
	}
}

/** function setImage(side, name)
 * Sets the image to the requested weapon on the provided side
 * @param side : The side to set the image on
 * @param name : The name of the weapon (should match image name exactly)
 * @returns : Nothing
 */
function setImage(side, name) {
	if (side == "Left") {
		document.getElementById("imageLeft").src = "img/weapons/" + name + ".png";
	} else if (side == "Right") {
		document.getElementById("imageRight").style.backgroundImage = "url(\"img/weapons/" + name + ".png\")";
	} else {
		alert("Error 2");
	}
}

/** function setTypeOptions(side, weapon)
 * Resets attack type options on the provided side and enables/disables all buttons
 * depending on if it is a melee or ranged weapon
 * @param side : The side
 * @param weapon : The weapon
 * @returns : Nothing
 */
function setTypeOptions(side, weapon) {
	var categoryButtons = document.getElementById("categoryBar").getElementsByTagName("button");
	var typeButtons = document.getElementById("attType"+side).getElementsByTagName("button");
	var attacks = getWeaponData(weapon).getElementsByTagName("Attack");
	var leftDiv = document.getElementsByClassName("statHalf")[0];
	
	if (categoryButtons[0].classList.contains("catActive")) {
		// If category is melee, enable buttons and default to Strike
		for (i=0; i<typeButtons.length; i++) {
			typeButtons[i].disabled = false;
		}
		leftDiv.classList.remove("invisible");
		typeButtons[0].setAttribute("class", "strikeSel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		
		if (attacks.length <= 2) {
			typeButtons[2].disabled = true;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		} else {
			typeButtons[2].disabled = false;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.remove("altDisabled");
		}
	} else if (categoryButtons[1].classList.contains("catActive")) {
		// If category is Ranged, disable and unselect all attack type buttons
		for (i=0; i<typeButtons.length; i++) {
			typeButtons[i].disabled = true;
		}
		leftDiv.classList.remove("invisible");
		typeButtons[0].setAttribute("class", "strikeUnsel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
	} else {
		// If category is Shield, disable and unselect all attack type buttons and hide speed/damage tables
		for (i=0; i<typeButtons.length; i++) {
			typeButtons[i].disabled = true;
		}
		leftDiv.classList.add("invisible");
		typeButtons[0].setAttribute("class", "strikeUnsel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
	}
}

/** function switchAttMode(btn)
 * Switches the attack mode for the provided side
 * @param btn : The button being clicked
 * @returns : Nothing
 */
function switchAttMode(btn) {
	var buttons = btn.parentNode.getElementsByTagName("button");
	var altButton = btn.parentNode.parentNode.getElementsByClassName("altButton")[0];
	
	if (btn.classList.contains("strikeSel") || btn.classList.contains("stabSel")) {
		// Do nothing if button is already selected
		return;
	} else if (buttons[0].classList.contains("strikeUnsel") && buttons[1].classList.contains("stabUnsel")
			&& altButton.classList.contains("altSel")) {
		// If neither strike or stab was selected and alt was, weapon does not have alt strike/stab
		// and the alt button needs to be unchecked
		altButton.classList.replace("altSel", "altUnsel");
	}
	
	if (btn == buttons[0] && btn.classList.contains("strikeUnsel")) {
		buttons[0].classList.replace("strikeUnsel", "strikeSel");
		buttons[1].classList.replace("stabSel", "stabUnsel");
	} else if (btn == buttons[1] && btn.classList.contains("stabUnsel")){
		buttons[0].classList.replace("strikeSel", "strikeUnsel");
		buttons[1].classList.replace("stabUnsel", "stabSel");
	} else {
		alert("Something went wrong switching the attack mode");
	}
	
	updateStats(getElementSide(btn), document.getElementById("weapon"+getElementSide(btn)).getElementsByClassName("optionText")[0].innerHTML);
}

/** function switchCategory(cat) {
 * Switches the category of weapons to display lists for, then updates stats
 * @param cat : The category to show
 * @returns : Nothing
 */
function switchCategory(cat) {
	var catButtons = document.getElementsByClassName("catButton");
	var activeBtn = document.getElementsByClassName("catActive");
	
	for (b=0; b<catButtons.length; b++) {
		if (catButtons[b].id == cat.toLowerCase()+"Button") {
			catButtons[b].setAttribute("class", "catButton catActive");
			catButtons[b].disabled = true;
		} else {
			catButtons[b].setAttribute("class", "catButton");
			catButtons[b].disabled = false;
		}
	}
	
	populateLists(cat);
}

/** function toggleAltMode(btn)
 * Toggles the alt mode on/off for the clicked side
 * @param btn : The button being clicked
 * @returns : Nothing
 */
function toggleAltMode(btn) {	
	var side, weaponData;
	side = getElementSide(btn);
	var attackModeButtons = btn.parentNode.parentNode.getElementsByClassName("attButton");
	
	if (btn.classList.contains("altSel")) {
		btn.classList.replace("altSel", "altUnsel");
		if (attackModeButtons[0].classList.contains("strikeUnsel") && attackModeButtons[1].classList.contains("stabUnsel")) {
			// If both strike and stab were unselected,
			// then this alt was a melee throw and it should default to/reselect Strike
			attackModeButtons[0].classList.replace("strikeUnsel", "strikeSel");
		}
		
	} else {
		btn.classList.replace("altUnsel", "altSel");
		weaponData = getWeaponData(document.getElementById("weapon"+side).getElementsByClassName("currSelected")[0].getElementsByClassName("optionText")[0].innerHTML);

		if(weaponData.getElementsByTagName("AttackType")[2].childNodes[0].nodeValue == "Melee Throw") {
			// If the third attack type node for the weapon data is "Melee Throw"
			// then this alt is a melee throw and it should deselect both strike and stab buttons
			attackModeButtons[0].classList.replace("strikeSel", "strikeUnsel");
			attackModeButtons[1].classList.replace("stabSel", "stabUnsel");
		}
	}

	
	currWeapElem = document.getElementById("weapon"+side).getElementsByClassName("currSelected")[0];
	updateStats(side, currWeapElem.getElementsByClassName("optionText")[0].innerHTML);
}

/** function toggleComparisons()
 * Shows/hides the stat comparisons
 * @returns : Nothing
 */
function toggleComparisons(btn) {
	btn.classList.toggle("checked");
	
	var compsL = document.getElementsByClassName("compL");
	var compsR = document.getElementsByClassName("compR");
	
	for (i=0; i<compsL.length; i++) {
		if (compsL[i].hidden == true) {
			compsL[i].hidden = false;
			compsR[i].hidden = false;
		} else {
			compsL[i].hidden = true;
			compsR[i].hidden = true;
		}
	}
	
	var textStats = document.getElementsByClassName("textStat");
	for (i=0; i<textStats.length; i++) {
		textStats[i].classList.toggle("cNoColor");
	}
}

/** function toggleFAQ(event)
 * Toggles the FAQ menu on/off and closes Known Issues menu if open
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleFAQ(event) {
	event.stopPropagation();
	var faqMenu = document.getElementById("faqMenu");
	var issuesMenu = document.getElementById("issuesMenu");
	faqMenu.classList.toggle("menuHide")
	issuesMenu.classList.add("menuHide");
}

/** function toggleHelp(event)
 * Toggles the help menu on/off and closes other open lists/menus
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleHelp(event) {
	event.stopPropagation();
	var menu = document.getElementById("helpMenu");
	if (menu.classList.contains("menuHide")) {
		closeMenus();
		menu.classList.remove("menuHide");
	} else {
		menu.classList.add("menuHide");
	}
}

/** function toggleIssues(event)
 * Toggles the Known Issues on/off and closes FAQ menu if open
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleIssues(event) {
	event.stopPropagation();
	var faqMenu = document.getElementById("faqMenu");
	var issuesMenu = document.getElementById("issuesMenu");
	issuesMenu.classList.toggle("menuHide")
	faqMenu.classList.add("menuHide");
}


/** function toggleList(event)
 * Opens/closes the given listItems element and closes other list if open
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleList(event) {
	event.stopPropagation();
	var listDiv = this.parentNode.getElementsByClassName("listItems")[0];
	var dummyDiv = this.parentNode.getElementsByClassName("dummyList")[0]
	if (listDiv.classList.contains("menuHide")) {
		closeMenus();
		listDiv.classList.remove("menuHide");
		dummyDiv.classList.remove("menuHide");
	} else {
		listDiv.classList.add("menuHide");
		dummyDiv.classList.add("menuHide");
	}
}

/** function togglePeasant(event)
 * Toggles the help menu on/off and closes other open lists/menus
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function togglePeasant(btn) {
	btn.classList.toggle("checked");

	var weapLeft = document.getElementsByClassName("listSelected")[0];
	var dataLeft = getWeaponData(weapLeft.getElementsByClassName("optionText")[0].innerHTML);
	var weapRight = document.getElementsByClassName("listSelected")[1];
	var dataRight = getWeaponData(weapRight.getElementsByClassName("optionText")[0].innerHTML);
	
	var newLeft, newRight, newListOpt, listOpts;
	var listOptsLeft = document.getElementById("weaponLeft").getElementsByClassName("listOption");
	var listOptsRight = document.getElementById("weaponRight").getElementsByClassName("listOption");

	if (dataLeft.getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
		newLeft = getNewDefault().getElementsByTagName("Name")[0].childNodes[0].nodeValue;
		listOpts = document.getElementById("weaponLeft").getElementsByClassName("listOption");
		for (lo=0; lo<listOpts.length; lo++) {
			if (listOpts[lo].getElementsByClassName("optionText")[0].innerHTML == newLeft) {
				newListOpt = listOpts[lo];
				break;
			}
		}
		if (newListOpt == null) {
			alert("Error tP1: can't find list option for new weapon selection");
			return;
		}
		changeWeapon(newListOpt);
	}
	if (dataRight.getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
		if (newLeft == null) {
			newRight = getNewDefault().getElementsByTagName("Name")[0].childNodes[0].nodeValue;
		} else {
			// If both weapons were peasant when show peasant button is disabled,
			// make sure new weapons aren't the same
			do {
				newRight = getNewDefault().getElementsByTagName("Name")[0].childNodes[0].nodeValue;
			} while (newLeft == newRight)
		}
		listOpts = document.getElementById("weaponRight").getElementsByClassName("listOption");
		for (lo=0; lo<listOpts.length; lo++) {
			if (listOpts[lo].getElementsByClassName("optionText")[0].innerHTML == newRight) {
				newListOpt = listOpts[lo];
				break;
			}
		}
		if (newListOpt == null) {
			alert("Error tP2: can't find list option for new weapon selection");
			return;
		}
		changeWeapon(newListOpt);
	}
	
	makeLists();
}

/** function toggleSettings(event)
 * Toggles the settings menu on/off and closes other open lists/menus
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleSettings(event) {
	event.stopPropagation();
	var menu = document.getElementById("settingsMenu");
	if (menu.classList.contains("menuHide")) {
		closeMenus();
		menu.classList.remove("menuHide");
	} else {
		menu.classList.add("menuHide");
	}
}

/** function toggleSort(btn)
 * Toggles the weapon list sorting method between name (default) and point cost
 * @param btn : The button calling this function
 * @returns : Nothing
 */
function toggleSort(btn) {
	var buttons = btn.parentNode.parentNode.getElementsByTagName("button");
	if (btn.classList.contains("checked")) {
		// Don't respond to click on checked element
	} else {
		buttons[0].classList.toggle("checked");
		buttons[0].disabled = !buttons[0].disabled;
		buttons[1].classList.toggle("checked");
		buttons[1].disabled = !buttons[1].disabled;
	}
	
	makeLists();
}

/** function updateStats(side, name)
 * Updates the statistics and image for the provided side,
 * as well as the comparisons (unless the other side has no selection yet).
 * @param side : Which side to update the stats for
 * @param name : The name of the weapon
 * @returns : Nothing
 */
function updateStats(side, name) {
	clearTables(side);
	
	// Get XML data for current weapon
	var weaponData = getWeaponData(name);
	
	// Get provided side and other side's selected attack types
	var attackType, otherAttackType, otherSide;
	if (getCategory() == "Shield") {
		attackType = "Shield";
	} else {
		attackType = getAttackType(side);
	}
	
	if (side == "Left") {
		otherSide = "Right";
	} else if (side == "Right") {
		otherSide = "Left";
	} else {
		alert("Error 1");
		return;
	}
	otherAttackType = getAttackType(otherSide);
	
	// -=-=-=-=-= Update stats for provided side =-=-=-=-=-
	
	// Get the Attack XML node
	var attacks, attackNode;
	var attacks = weaponData.getElementsByTagName("Attack");
	for (i=0; i<attacks.length; i++) {
		if (attacks[i].getElementsByTagName("AttackType")[0].childNodes[0].nodeValue == attackType) {
			attackNode = attacks[i];
		}
	}
	if (attackNode == null) {
		alert("\""+attackType+"\" data for " + name + " does not exist.");
		return;
	}
	
	// Update damage table
	var row;
	var s = side.charAt(0); // Gives "L" or "R"; for convenience
	var otherS = otherSide.charAt(0);
	var bodyPart; // Will hold body part
	var b; // Will hold letter corresponding to body part
	var damElem;
	
	for (row=0; row<3; row++) {
		if (row == 0) {
			bodyPart = "Head";
			b = "h";
		}  else if (row == 1) {
			bodyPart = "Torso";
			b = "t";
		} else if (row == 2) {
			bodyPart = "Legs";
			b = "l";
		}
		for (col=0; col<4; col++) {
			damElem = document.getElementById("a"+col+b+s);
			compElem = damElem.nextSibling;
			otherCompElem = document.getElementById("a"+col+b+otherS).nextSibling;
			
			try {
				// If requested XML node does not exist or is empty, this will fail and set damElem to "-"
				damElem.innerHTML = attackNode.getElementsByTagName(bodyPart)[0].getElementsByTagName("Armor"+col)[0].childNodes[0].nodeValue;	
			} catch (e) {
				damElem.innerHTML = "–";
			}
			
			if (damElem.innerHTML >= 100) {
				damElem.parentNode.classList.add("damageHigh");
			} else if (damElem.innerHTML >= 50) {
				damElem.parentNode.classList.add("damageMedHigh");
			} else if (damElem.innerHTML >= 34) {
				damElem.parentNode.classList.add("damageMed");
			} else if (damElem.innerHTML >= 25) {
				damElem.parentNode.classList.add("damageMedLow");
			} else if (damElem.innerHTML >= 0) {
				damElem.parentNode.classList.add("damageLow");
			} else {
				damElem.parentNode.classList.add("emptyDam");
			}
		}
	}
	
	// Update speed table
	var speedTitles = document.getElementById("speedTable").getElementsByClassName("spTableTitle");
	var speedNodes;
	try { // Thrown melee weapon does not have speed stats
		speedNodes = attackNode.getElementsByTagName("Speed")[0].children;
	} catch (e) {}
	
	var nodeCount = 0; // First node is the XML text node, which will be null
	var spTitleName;
	
	for (i=0; i<speedTitles.length; i++) {
		spTitleName = speedTitles[i].innerHTML.toLowerCase();
		if (speedNodes == null) { // Thrown melee weapon does not have speed stats
			document.getElementById(spTitleName+side).innerHTML = "N/A";
			document.getElementById(spTitleName+side).classList.add("emptyStat");
		} else if (nodeCount < speedNodes.length && speedNodes[nodeCount].tagName.toLowerCase() == spTitleName
				&& speedNodes[nodeCount].childNodes[0] != null) {
				// If current stat matches the current XML tag and has data
			document.getElementById(spTitleName+side).innerHTML = speedNodes[nodeCount].childNodes[0].nodeValue + "ms";
			document.getElementById(spTitleName+side).classList.remove("emptyStat");
			nodeCount++;
		} else {
			document.getElementById(spTitleName+side).innerHTML = "N/A";
			document.getElementById(spTitleName+side).classList.add("emptyStat");
		}
	}

	// Update general stats
	var genTitles = document.getElementsByClassName("genTitle");
	var genNodes = attackNode.getElementsByTagName("GeneralStats")[0].children;
	nodeCount = 0;
	
	for (i=0; i<genTitles.length; i++) {
		if (nodeCount < genNodes.length && genTitles[i].id == genNodes[nodeCount].tagName
				&& genNodes[nodeCount].childNodes[0] != null && genNodes[nodeCount].childNodes[0].nodeValue != "-") {
				// If current stat matches the current XML tag and has data
			if (genTitles[i].id == "Length") {
				document.getElementById(genTitles[i].id+s).innerHTML = genNodes[nodeCount].childNodes[0].nodeValue + "cm";
				document.getElementById(genTitles[i].id+s).classList.remove("emptyStat");
			} else {
				document.getElementById(genTitles[i].id+s).innerHTML = genNodes[nodeCount].childNodes[0].nodeValue;
				document.getElementById(genTitles[i].id+s).classList.remove("emptyStat");
			}
			nodeCount++;
		} else {
			document.getElementById(genTitles[i].id+s).innerHTML = "N/A";
			document.getElementById(genTitles[i].id+s).classList.add("emptyStat");
		}
	}
	
	// Fill name ribbons
	var ribbons = document.getElementsByClassName("name"+s);
	for (r=0; r < ribbons.length; r++) {
		ribbons[r].innerHTML = name;
	}

	setImage(side, name);
	// Do not set hidden elements or attempt to draw comparisons if the weapon category has just
	// been changed or set, as on the first update there will not be any stats on the other side yet.
	if (categoryChanged) {
		categoryChanged = false;
	} else {
		setHiddenElements();
		compare();
	}
}