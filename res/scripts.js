var _weapons, _weapNum, Max_Cost, _categoryChanged, _lastFocus, _lastX, _xMove, _mainBody, _animTimeout, _mobile;
	
/** function onPageLoad()
 * Function to be run on first page load
 * @returns : Nothing
 */
function onPageLoad() {
	// Define global variables
	_mainBody = document.getElementById("mainBody");
	_categoryChanged = true;
	_weapons = {};
	_lastFocus = document.getElementById("weaponRight").querySelector(".listInput");
	_mobile = false;
	Max_Cost = 33;
	document.body.width = document.body.offsetWidth;
	
	if (navigator.userAgent.match(/Mobi/)) adjustMobile();
	else {
		// Add hover listeners for alt table nametags (except on mobile as there is no space)
		var dDivsL = document.getElementById("damage").querySelectorAll(".damageTable.alt .damageDiv.left");
		var dDivsR = document.getElementById("damage").querySelectorAll(".damageTable.alt .damageDiv.right");
		for (d=0; d<dDivsL.length; d++) {
			dDivsL[d].addEventListener("mouseenter", function(){
				this.parentNode.parentNode.parentNode.querySelector(".damRibbon.left").style.display = "flex";
			});
			dDivsL[d].addEventListener("mouseleave", function(){
				this.parentNode.parentNode.parentNode.querySelector(".damRibbon.left").style.display = "none";
			});
			dDivsR[d].addEventListener("mouseenter", function(){
				this.parentNode.parentNode.parentNode.querySelector(".damRibbon.right").style.display = "flex";
			});
			dDivsR[d].addEventListener("mouseleave", function(){
				this.parentNode.parentNode.parentNode.querySelector(".damRibbon.right").style.display = "none";
			});
		}
		
		/*
		var divideL = document.getElementById("damage").querySelectorAll(".divider .left");
		var divideR = document.getElementById("damage").querySelectorAll(".divider .right");
		for (d=0; d<divideL.length; d++) {
			divideL[d].addEventListener("mouseenter", function(){
				this.parentNode.parentNode.parentNode.parentNode.querySelector(".damRibbon.left").style.display = "flex";
			});
			divideL[d].addEventListener("mouseleave", function(){
				this.parentNode.parentNode.parentNode.parentNode.querySelector(".damRibbon.left").style.display = "none";
			});
			divideR[d].addEventListener("mouseenter", function(){
				this.parentNode.parentNode.parentNode.parentNode.querySelector(".damRibbon.right").style.display = "flex";
			});
			divideR[d].addEventListener("mouseleave", function(){
				this.parentNode.parentNode.parentNode.parentNode.querySelector(".damRibbon.right").style.display = "none";
			});
		}
		*/
	}
	
	var weapTemp, xmlhttp, xmlDoc, issuehttp, issueDoc, changeshttp, changesDoc;
	
	if (window.XMLHttpRequest) { // For IE7+, Firefox, Chrome, Opera, & Safari
		xmlhttp = new XMLHttpRequest();
		issuehttp = new XMLHttpRequest();
		changeshttp = new XMLHttpRequest();
	}
	else { // For IE6, IE5 (ishygddt)
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		issuehttp = new ActiveXObject("Microsoft.XMLHTTP");
		changeshttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	// Set event listeners for document
	document.addEventListener("click", function(e) {
		closeMenus();
	});
	document.addEventListener("mousedown", function(e) {
		if (e.button == 2) e.preventDefault();
	});
	document.addEventListener("keyup", function(e) {
		if (e.code == "Escape") {
			document.activeElement.blur();
			closeMenus();
		} else if (e.code == "Tab") {
			if (_lastFocus == document.getElementById("weaponLeft").querySelector(".listInput")) focusInput(document.getElementById("weaponRight").querySelector(".listInput"));
			else focusInput(document.getElementById("weaponLeft").querySelector(".listInput"));
		}
	});
	
	xmlhttp.onreadystatechange = function (err) {
		if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
			console.log("MordStats.xml loaded successfully.");
			xmlDoc = xmlhttp.responseXML;
			
			// Set global variable for number of weapons
			try {
				weapTemp = xmlDoc.getElementsByTagName("Weapon");
				_weapNum = weapTemp.length;
			} catch (err) {
				alert("An error occurred parsing XML file");
				return;
			}
			
			if (_weapNum == null) {
				alert("An unknown error occurred with XML file.");
			} else {
				// Full success opening and parsing XML file.  Continue with script.
				var dMod = document.getElementById("damageField");
				dMod.placeholder = "1.00"; // Input value/placeholder carries on page reload for some reason
				dMod.value = "1.00";       // so these must be reset (then overwritten by cookies if present)
				applyCookies();
				
				weapTemp = [].slice.call(weapTemp); // Convert DOM NodeList into array so it can be sorted
				weapTemp.sort(nameCompare);
				for (var x in weapTemp) { // Create weapons array as associative array
					_weapons[weapTemp[x].getElementsByTagName("Name")[0].childNodes[0].nodeValue] = weapTemp[x];
				}
				
				// Add event listener to have tooltip(s) follow mouse pointer
				window.onmousemove = function(event) {
					var tooltips = document.querySelectorAll(".menuBtnDiv:hover + .tooltip");
					var x = event.clientX, y = event.clientY;
					
					if (tooltips.item(0)) {
						if ((x + 14 + tooltips.item(0).offsetWidth) > window.innerWidth) {
						//	tooltips.item(0).style.left = (x - 8 - tooltips.item(0).offsetWidth) + "px";
							tooltips.item(0).style.left = (window.innerWidth - tooltips.item(0).offsetWidth) + "px";
						} else {
							tooltips.item(0).style.left = (x + 14) + "px";
						}
						if ((y + 12 + tooltips.item(0).offsetHeight) > window.innerHeight) {
							tooltips.item(0).style.top = (y - 4 - tooltips.item(0).offsetHeight) + "px";
						} else {
							tooltips.item(0).style.top = (y + 12) + "px";
						}
					}
				};
				
				var parameters = getURLParameters();
				if (parameters == "") populateLists("Melee", "");
				else {
					populateLists("None", parameters);
					history.replaceState(history.state, history.title, "/");
				}
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
		if (issuehttp.readyState === 4 && issuehttp.status === 200) {
			console.log("KnownIssues.txt loaded successfully.");
			issueDoc = issuehttp.responseText;
			
			try {
				fillIssues(issueDoc);
			} catch (err) {
				alert("An error occurred while reading the known issues file");
				return;
			}
		} else if (issuehttp.readyState === 3 && issuehttp.status === 404) {
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
	
	changeshttp.onreadystatechange = function (err) {
		if (changeshttp.readyState === 4 && changeshttp.status === 200) {
			console.log("changelog.txt loaded successfully.");
			changesDoc = changeshttp.responseText;
			
			try {
				fillChangelog(changesDoc);
			} catch (err) {
				alert("An error occurred while reading the changelog file");
				return;
			}
		} else if (changeshttp.readyState === 3 && changeshttp.status === 404) {
			alert("An error occurred opening the known issues file for reading.");
		}
	};
	
	changeshttp.onerror = function (err) {
		console.error(changeshttp.statusText);
		alert("Unknown error occurred with known issues file.");
	};
	
	changeshttp.open("GET","res/changelog.txt");
	changeshttp.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
	changeshttp.setRequestHeader('cache-control', 'max-age=0');
	changeshttp.setRequestHeader('expires', '0');
	changeshttp.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
	changeshttp.setRequestHeader('pragma', 'no-cache');
	changeshttp.send();
}

/** function adjustMobile()
 * If a mobile browser is detected, make adjustments to the page to allow full mobile compatibility
 * @returns : Nothing
 */
function adjustMobile() {
	_mobile = true;
	
	// Add event listeners to track swipe movement across the swipe bar and to move it accordingly
	var swipeWrap = document.getElementById("swipeWrap");
	var imageSlider = document.getElementById("imageSlider");
	swipeWrap.addEventListener('touchstart', function(e) {
		clearTimeout(_animTimeout)
		_lastX = parseInt(e.changedTouches[0].pageX);
		e.preventDefault();
		closeMenus();
	});
	swipeWrap.addEventListener('touchmove', function(e) {
		_xMove = (parseInt(e.changedTouches[0].pageX) - _lastX)/document.body.offsetWidth;
		var newLeft = (_mainBody.offsetLeft/document.body.offsetWidth + _xMove);
		if (newLeft < 0) _mainBody.style.left = 0 + "%";
		else if (newLeft > 0.85) _mainBody.style.left = 85 + "%";
		else _mainBody.style.left = newLeft*100 + "%";

		_lastX = parseInt(e.changedTouches[0].pageX);
		e.preventDefault();
	});
	swipeWrap.addEventListener('touchend', function(e) {
		animateSlide(e);
		e.preventDefault();
	});
	
	// Prevent swiping on image box instead of swipe bar from scrolling entire body
	imageSlider.addEventListener('touchstart', function(e) {
		e.preventDefault();
	});
	imageSlider.addEventListener('touchmove', function(e) {
		e.preventDefault();
	});
	imageSlider.addEventListener('touchend', function(e) {
		e.preventDefault();
	});
	
	// Insert category bar in infobox so it does not stay fixed at the top
	var infoBox = document.getElementById("infoBox");
	infoBox.insertBefore(document.getElementById("categoryBar"), infoBox.firstChild);
	
	// Hide second stat half and insert general table in the first half for single column view
	var statHalves = document.getElementsByClassName("statHalf");
	var generalElem = document.getElementById("general");
	statHalves[0].appendChild(generalElem);
	statHalves[1].style.display = "none";
	
	// Hide sharetip so it doesn't stay up when you tap share link
	var tip = document.getElementById("shareTip");
	tip.classList.add("invisible");
	
	// Mobile view does not allow space for nametags
	var permTagsOpt = document.querySelectorAll("#tableOptsWrapper .menuOptWrapper")[1];
	setCookie("tagsOn", "false");
	permTagsOpt.classList.add("invisible");
	
	// Set popTexts to hidden so they can be touched to open
	var popTexts = document.getElementsByClassName("popText");
	for (p=0; p<popTexts.length; p++) {
		popTexts[p].classList.add("popHide");
	}
}

/** function animateSlide(e)
 * Recursive function that runs when swipe bar is let go of.
 * Animates the sliding function of the info box so that it always ends up on either side of the screen,
 * depending on where it is and how the user was moving it upon release.
 * @param e : The slide event object
 * @returns : Nothing
 */
function animateSlide(e) {
	var currLeft = Number(_mainBody.style.left.replace("%",""));
	
	if (currLeft >= 85) {
		_mainBody.style.left = "85%";
		return;
	} else if (currLeft <= 0) {
		_mainBody.style.left = "0%";
		return;
	} else if (currLeft >= 78) _mainBody.style.left = currLeft+0.5 + "%";
	else if (currLeft <= 7) _mainBody.style.left = currLeft-0.5 + "%";
	else if (Math.abs(_xMove) < 0.2 || _xMove == null) {
		// If moving too slow or not at all, set fixed move speed. If at least a certain speed, maintain direction.
		if (_xMove == null) _xMove = 0.2;
		else if (Math.abs(_xMove) >= 0.02) _xMove = Math.abs(_xMove)/_xMove * 0.2;
		else if (currLeft >= 50) _xMove = 0.2;
		else if (currLeft < 50) _xMove = -0.2;
		_mainBody.style.left = currLeft + 100*_xMove/10 + "%";
	} else {
		_mainBody.style.left = currLeft + 100*_xMove/10 + "%";
	}
	
	_animTimeout = setTimeout(function(){ animateSlide(e); }, 5);
}

/** function applyCookies()
 * Sets various settings based on any present cookies
 * @returns : Nothing
 */
function applyCookies() {
	var cookies = getCookies();
	if (cookies["classicOn"] == "true") toggleClassic(document.getElementById("classicBtn"));
	if (cookies["peasOn"] == "true") document.getElementById("peasantBtn").classList.add("checked");
	if (cookies["miscOn"] == "true") document.getElementById("miscBtn").classList.add("checked");
	if (cookies["huntOn"] == "true") {
		document.getElementById("huntBtn").classList.add("checked");
		document.getElementById("huntWarning").classList.remove("invisible");
	}
	if (cookies["tagsOn"] == "true") toggleTags(document.getElementById("tagsBtn"));
	if (cookies["sortBy"] == "name") {
		var sortBtns = document.getElementById("sortWrapper").getElementsByClassName("checkbox");
		sortBtns[0].classList.add("checked");
		sortBtns[1].classList.remove("checked");
	}
	if (cookies.hasOwnProperty("dMod") && cookies["dMod"] != "1.00") {
		var dField = document.getElementById("damageField");
		dField.value = cookies["dMod"];
		dField.placeholder = cookies["dMod"];
		document.getElementById("dMod").innerHTML = dField.value;
		document.getElementById("dModWarning").classList.remove("invisible");
	}
	if (cookies.hasOwnProperty("comps") && cookies["comps"] != "Full") {
		var compOpts = document.getElementById("compItems").getElementsByClassName("compOpt");
		for (c in compOpts) {
			if (compOpts[c].innerHTML == cookies["comps"]) {
				changeComps(compOpts[c]);
				break;
			}
		}
	}
}

/** function capitalize(text)
 * Capitalizes the first letter of each word in a string
 * @param text : The input string
 * @returns : The output string
 */
function capitalize(text) {
	var words = text.split(" ");
	for (w in words) {
		words[w] = words[w].charAt(0).toUpperCase() + words[w].substring(1);
	}
	return words.join(" ");
}

/** function changeComps(div)
 * Changes display of the stat comparisons, depending on the chosen setting
 * @param div : The newly selected element
 * @returns : Nothing
 */
function changeComps(div) {
	var comps = document.querySelectorAll(".comp:not(.cNone)");
	var textStats = document.getElementsByClassName("textStat");
	var curr = document.getElementById("compSel");
	var opts = ["Full", "Simple", "None"];
	var optDivs = document.getElementsByClassName("compOpt");
	
	if (div.innerHTML == "None") document.body.classList.add("noComps");
	else document.body.classList.remove("noComps");
	
	curr.innerHTML = div.innerHTML;
	opts.splice(opts.indexOf(curr.innerHTML), 1);
	for (z=0; z<2; z++) {
		optDivs[z].innerHTML = opts[z];
	}
	
	if (curr.innerHTML == "Simple" && comps[0].innerHTML.length > 3) {
		// If simple has been selected and comparisons are not currently simple (length is greater than 3, ergo full format),
		// trim comparisons down to simple format
		for (i=0; i<comps.length; i++) {
			comps[i].innerHTML = comps[i].innerHTML.substring(0,2) + ")";
		}
	} else if (curr.innerHTML != "None" && comps[0].innerHTML.length <= 3) {
		// If full has been selected and there are simple or no comparisons present,
		// or if simple has been selected and there are no comparisons present,
		// comparisons must be redone. I know it's inefficient, I'll find a better way later
		compare();
	}
	
	setCookie("comps", curr.innerHTML);
}

/** function changeWeapon(newSelect)
 * Updates the weapon list to reflect the new weapon being selected, then calls updateStats
 * @param newSelect : The listOption element that was selected
 * @returns : Nothing
 */
function changeWeapon(newSelect) {
	var side = getElementSide(newSelect);
	var weaponListElem = newSelect.parentNode.parentNode;
	var listInput = weaponListElem.getElementsByClassName("listInput")[0];
	var currSelElem = weaponListElem.getElementsByClassName("currSelected")[0];
	
	listInput.value = newSelect.getElementsByClassName("optionText")[0].innerHTML;
	currSelElem.classList.remove("currSelected");
	newSelect.classList.add("currSelected");

	setTypeOptions(side, listInput.value);
	updateStats(side, listInput.value);
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
 * @param side : The side to clear the tables for
 * @returns : Nothing
 */
function clearTables(side) {
	// Clear damage table
	var damageValues = document.querySelectorAll(".damageValue");
	var s = side.charAt(0), divider;
	
	for (i=0; i<damageValues.length; i++) {
		if (damageValues[i].id.charAt(damageValues[i].id.length-1) == s) {
			damageValues[i].innerHTML = "";
			damageValues[i].setAttribute("class", "damageValue posCorr");
			damageValues[i].parentNode.classList.remove("emptyDam", "damageNeg", "damageLow", "damageMedLow", "damageMed",
														"damageMedHigh", "damageHigh");
			divider = damageValues[i].parentNode.querySelector(".divider");
			if (divider != null) {
				divider.children[0].setAttribute("class", "left");
				divider.children[1].setAttribute("class", "right");
			}
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

/** function closeList(list)
 * Closes the provided list
 * @param list : The .listItems element
 * @returns : Nothing
 */
function closeList(list) {
	list.parentNode.querySelector(".listInput").blur();
	if (list != null && list.classList.contains("menuHide")) return;
	var dummyList = list.parentNode.querySelector(".dummyList");
	list.classList.add("menuHide");
	dummyList.classList.add("menuHide");
	if (_mobile) document.getElementById("infoBox").style.overflowY = "auto";
}

/** function closeMenus(noClose)
 * Closes menus and lists
 * @param noClose : Optional parameter; if present, do not close the provided menu/list
 * @returns : Nothing
 */
function closeMenus(noClose) {
	var lists = document.getElementsByClassName("listItems");
	var dummies = document.getElementsByClassName("dummyList");
	for (i=0; i<lists.length; i++) {
		if (lists[i] != noClose) {
			if (!lists[i].classList.contains("menuHide")) lists[i].parentNode.querySelector("input").value = lists[i].querySelector(".currSelected > .optionText").innerHTML;
			lists[i].classList.add("menuHide");
			dummies[i].classList.add("menuHide");
		}
	}
	if (_mobile) document.getElementById("infoBox").style.overflowY = "scroll";
	
	var menus = document.getElementsByClassName("menu");
	for (i=0; i<menus.length; i++) {
		if (menus[i] != noClose) menus[i].classList.add("menuHide");
	}
	
	var compItems = document.getElementById("compItems");
	if (compItems != noClose) compItems.classList.add("menuHide");
	
	var popTexts = document.getElementsByClassName("popText");
	for (p=0; p<popTexts.length; p++) {
		if (popTexts[p] != noClose) popTexts[p].classList.add("popHide");
	}
}

/** function compare() {
 * Calculates the comparisons between most stats and alters the color of non-numerical stats that are different
 * @returns : Nothing
 */
function compare() {
	var compsL = document.querySelectorAll(".comp.L");
	var compsR = document.querySelectorAll(".comp.R");
	var textStats = document.getElementsByClassName("textStat");
	var dataL, dataR;
	
	var simpleComps = (document.getElementById("compSel").innerHTML == "Simple");
	
	// Make comparisons for numeric stats
	for (i=0; i<compsL.length; i++) {
		dataL = compsL[i].parentNode.children[0].innerHTML;
		dataR = compsR[i].parentNode.children[0].innerHTML;
		dataComps = new Array(compsL.length);
		if (isNumber(dataL) && isNumber(dataR)) {
			if (compsL[i].previousElementSibling.id.includes("GravityScale")) {
				dataComps[i] = (10*dataL - 10*dataR)/10; // Because Javascript is weird and cant handle decimal subtraction properly
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

		compsL[i].classList.remove("cPos", "cNeg", "cNeut", "cNone");
		compsR[i].classList.remove("cPos", "cNeg", "cNeut", "cNone");
		
		// Wood damage and knockback can have negative values which are not better or worse than positive values
		if (compsL[i].parentNode.parentNode.parentNode.children[0].id == "WoodDamage"
			|| compsL[i].parentNode.parentNode.parentNode.children[0].id == "Knockback") {
			compsL[i].previousElementSibling.classList.remove("posCorr", "neutCorr", "negCorr");
			compsR[i].previousElementSibling.classList.remove("posCorr", "neutCorr", "negCorr");
			if (dataL < 0 && dataR < 0) {
				compsL[i].previousElementSibling.classList.add("negCorr");
				compsR[i].previousElementSibling.classList.add("negCorr");
			} else if (dataL < 0 || dataR < 0) {
				compsL[i].previousElementSibling.classList.add("neutCorr");
				compsR[i].previousElementSibling.classList.add("neutCorr");
			} else {
				compsL[i].previousElementSibling.classList.add("posCorr");
				compsR[i].previousElementSibling.classList.add("posCorr");
			}
		}
		
		if (dataComps[i] > 0) {
			if (compsL[i].parentNode.children[0].classList.contains("posCorr")) {
				compsL[i].classList.add("cPos");
				compsR[i].classList.add("cNeg");
			} else if (compsL[i].parentNode.children[0].classList.contains("negCorr")) {
				compsL[i].classList.add("cNeg");
				compsR[i].classList.add("cPos");
			} else if (compsL[i].parentNode.children[0].classList.contains("neutCorr")) {
				compsL[i].classList.add("cNeut");
				compsR[i].classList.add("cNeut");
			}
			if (compsL[i].previousElementSibling.id.includes("GravityScale")) {
				compsL[i].innerHTML = "(+" + dataComps[i].toFixed(1) + ")";
				compsR[i].innerHTML = "(" + -dataComps[i].toFixed(1) + ")";
			} else {
				compsL[i].innerHTML = "(+" + dataComps[i].toFixed(0) + ")";
				compsR[i].innerHTML = "(" + -dataComps[i].toFixed(0) + ")";
			}
		} else if (dataComps[i] < 0) {
			if (compsL[i].parentNode.children[0].classList.contains("posCorr")) {
				compsL[i].classList.add("cNeg");
				compsR[i].classList.add("cPos");
			} else if (compsL[i].parentNode.children[0].classList.contains("negCorr")) {
				compsL[i].classList.add("cPos");
				compsR[i].classList.add("cNeg");
			} else if (compsL[i].parentNode.children[0].classList.contains("neutCorr")) {
				compsL[i].classList.add("cNeut");
				compsR[i].classList.add("cNeut");
			}

			if (compsL[i].previousElementSibling.id.includes("GravityScale")) {
				compsL[i].innerHTML = "(" + dataComps[i].toFixed(1) + ")";
				compsR[i].innerHTML = "(+" + -dataComps[i].toFixed(1) + ")";
			} else {
				compsL[i].innerHTML = "(" + dataComps[i].toFixed(0) + ")";
				compsR[i].innerHTML = "(+" + -dataComps[i].toFixed(0) + ")";
			}
		} else {
			// If no values or no difference between values, hide comparisons
			compsL[i].classList.add("cNone");
			compsR[i].classList.add("cNone");
		}
			
		if (simpleComps) {
			compsL[i].innerHTML = compsL[i].innerHTML.substring(0,2) + ")";
			compsR[i].innerHTML = compsR[i].innerHTML.substring(0,2) + ")";
		} else if (compsL[i].previousElementSibling.classList.contains("speedValue")) {
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

/** function fillChangelog(data)
 * Fills changelog with provided data
 * @param data : The data from the changelog file
 * @returns : Nothing
 */
function fillChangelog(data) {
	var changesElem = document.getElementById("changelog");
	var lines = data.split("\n");
	
	var newElem, changes = "", version;
	if (lines[0] != null) {
		var ping = document.getElementById("logPing");
		var cookies = getCookies();
		version = lines[0].substring(8, lines[0].length-1);
		ping.innerHTML = version;
		if (!cookies.hasOwnProperty("lastVersion") || Number(cookies["lastVersion"]) < Number(version)) {
			ping.classList.remove("invisible");
		}
	}
	for (l=0; l<lines.length; l++) {
		if (lines[l] == "") continue;
		
		newElem = document.createElement("div");
		if (lines[l].substring(0,7).includes("Version")) {
			newElem.setAttribute("class", "faqQ");
		} else {
			newElem.setAttribute("class", "faqA");
		}
		newElem.innerHTML = lines[l];
		changesElem.appendChild(newElem);
	}
}

/** function fillIssues(data)
 * Fills known issues menu with provided data
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

/** function filterList(listInput, event)
 * Function to be run on "onkeyup" event; filters list based on currently entered text
 * @param listInput : The input field for the active listSelected element
 * @param event : The event handler attached to this function
 * @returns : Nothing
 */
function filterList(listInput, event) {
	var opts = listInput.parentNode.parentNode.getElementsByClassName("listOption");
	var dummies = listInput.parentNode.parentNode.getElementsByClassName("dummyOption");
	var value = listInput.value.substring(0, listInput.selectionStart).toLowerCase();
	var optName, firstValid, resultFound = false;
	
	for (i=0; i<opts.length-1; i++) { // For each option in the list:
		optName = opts[i].getElementsByClassName("optionText")[0].innerHTML.toLowerCase();
		opts[i].classList.remove("predicted", "nav");
		// If option does not contain input text, hide it
		if (!optName.includes(value)) {
			opts[i].classList.add("invisible");
			dummies[i].classList.add("invisible");
		} else { // If it does, show it
			resultFound = true;
			// Upon finding the first value wherein the *beginning* is equal to the input text, store this option
			if (!firstValid && event.data != null && value != "" && optName.substring(0, value.length).includes(value)) {
				firstValid = optName;
				opts[i].classList.add("predicted");
			}
			opts[i].classList.remove("invisible");
			dummies[i].classList.remove("invisible");
		}
	}

	// If no result has been found, show the last element of the list which is the "No weapons found" element
	if (resultFound) {
		opts[opts.length-1].style.display = "none";
		dummies[dummies.length-1].style.display = "none";
	} else {
		opts[opts.length-1].style.display = "flex";
		dummies[dummies.length-1].style.display = "flex";
	}
	
	// If any options met the earlier criteria of starting with the input text, fill the input 
	// with the remainder of that option's name and select the rest of the text that was not originally part of the input
	if (firstValid != null && event.data != null) {
		listInput.value = firstValid;
		listInput.setSelectionRange(value.length, firstValid.length);
	}
}

/** function focusInput(input)
 * Focuses provided input
 * Clears current weapon value for new entry and unhides any previously hidden weapons.
 * Opens list for input element and closes other list
 * @param input : The input element
 * @returns : Nothing
 */
function focusInput(input) {
	input.focus();
	_lastFocus = input;
	var list = input.parentNode.parentNode.querySelector(".listItems");
	closeMenus(list);
	setTimeout(function(){
		openList(list);
	}, 0);
	input.value = "";

	// Unhide all options when menu is shown
	var opts = input.parentNode.parentNode.getElementsByClassName("listOption");
	var dums = input.parentNode.parentNode.getElementsByClassName("dummyOption");
	for (h=0; h<opts.length; h++) {
		opts[h].classList.remove("invisible", "predicted", "nav");
		dums[h].classList.remove("invisible");
	}
}

/** function generateLink()
 * Generates a URL for the current weapons and attack modes
 * @returns : Nothing
 */
function generateLink() {
	var link = window.location.protocol + "//" + window.location.hostname + "/";
	var modes = { "Strike":1, "Stab":2, "Alt Strike":3, "Alt Stab":4, "Melee Throw":5 };
	var wLeft = document.getElementById("weaponLeft").querySelector("input").value;
	var wRight = document.getElementById("weaponRight").querySelector("input").value;
	link += "?w=" + encodeURIComponent(wLeft.replace(" ", "_")) + "+" + encodeURIComponent(wRight.replace(" ", "_"));
	if (getCategory() == "Melee") {
		link += "&m=" + modes[getAttackType("Left")] + "+" + modes[getAttackType("Right")];
	}
	
	var tip = document.getElementById("shareTip");
	var linkBox = document.getElementById("shareLink");
	linkBox.value = link;
	linkBox.select();
	document.execCommand("copy");
	
	tip.innerHTML = "Link copied!";
	if (navigator.userAgent.match(/Mobi/)) tip.classList.remove("invisible");
	document.activeElement.blur();
	setTimeout(function() {
		tip.innerHTML = "Copy shareable link";
		if (navigator.userAgent.match(/Mobi/)) tip.classList.add("invisible");
	}, 3000);
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
			// If none of alt, strike, or stab are selected, then attack type is either ranged or shield,
			// depending on category
			if (getCategory() == "Shield") attackType = "Shield";
			else attackType = "Ranged";
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

/** function getCookies()
 * Returns an associative array of key:value pairs for cookies
 * @returns : An associative array of key:value pairs for cookies
 */
function getCookies() {
	if (!document.cookie.includes("=")) return {}; // Return empty object if no cookies are present
	
	var cooks = {}, tmp;
	var pairs = document.cookie.split(";");
	for (p=0; p<pairs.length; p++) {
		tmp = pairs[p].split("=");
		tmp[0] = tmp[0].trim();
		tmp[1] = tmp[1].trim();
		cooks[tmp[0]] = tmp[1];
	}
	
	return cooks;
}

/** function getElementSide(elem)
 * Returns the side for the provided element by finding nearest parent whose ID contains "Left" or "Right",
 * or "None" if it does not belong to one
 * @param elem : HTML document element
 * @returns : "Left", "Right", or "None"
 */
function getElementSide(elem) {
	while (elem.parentNode != null) {
		elem = elem.parentNode;
		if (elem.id != null && elem.id.includes("Left")) {
			return "Left";
		} else if (elem.id != null && elem.id.includes("Right")) {
			return "Right";
		}
	}
	
	return "None";
}

/** function getNewDefault()
 * Selects a new default weapon based on the current category (and if peasant and/or unequippable (misc) weapons are shown)
 * @returns : The name of the new weapon
 */
function getNewDefault() {
	var num;
	var cat = getCategory();
	if (document.getElementById("peasantBtn").classList.contains("checked")) {
		showPeasant = true;
	} else {
		showPeasant = false;
	}
	if (document.getElementById("miscBtn").classList.contains("checked")) {
		showMisc = true;
	} else {
		showMisc = false;
	}
	
	var keys = Object.keys(_weapons);
	do {
		num = Math.floor(Math.random()*_weapNum);
	} while (_weapons[keys[num]].getElementsByTagName("Type")[0].childNodes[0].nodeValue != cat
			|| (!showPeasant && _weapons[keys[num]].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes")
			|| (!showMisc && _weapons[keys[num]].getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes"));
	
	return keys[num];
}

/** function getURLParameters()
 * Parses the URL to get the keys and values of any parameters
 * @returns : A hash table of the keys and values {@code[[keys][values]]} of the URL parameters
 */
function getURLParameters() {
	var url = window.location.href;
	if (!url.includes("?")) return "";
	url = url.substring(url.indexOf("?")+1);
	
	var pairs = url.split("&");
	var keys = new Array(), values = new Array();
	var table = new Object(), tmp;
	for (var p in pairs) {
		tmp = pairs[p].split("=");
		table[tmp[0]] = tmp[1];
	}
	
	return table;
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
 * @returns : The Div array
 */
function makeLists() {
	var category = document.getElementsByClassName("catActive")[0].innerHTML;
	var boxes = document.getElementById("sortWrapper").getElementsByClassName("checkbox");
	var sortMethod;
	if (boxes[0].classList.contains("checked")) {
		sortMethod = "name";
	} else if (boxes[1].classList.contains("checked")) {
		sortMethod = "points";
	} else {
		alert("Error 4");
		return;
	}
	
	var showPeasant, showMisc;
	if (document.getElementById("peasantBtn").classList.contains("checked")) {
		showPeasant = true;
	} else {
		showPeasant = false;
	}
	if (document.getElementById("miscBtn").classList.contains("checked")) {
		showMisc = true;
	} else {
		showMisc = false;
	}

	var options = new Array();
	var pointCosts = new Array();
	var weaponLists, weapName, pointCosts, optionElement, optionImg, costText, optionText, selectedName;
	weaponLists = document.getElementsByClassName("weaponList");
	var keys = Object.keys(_weapons);
	
	// Loop through weapons, ignoring any that should not be currently shown
	for (var k in keys) {
		if (_weapons[keys[k]].getElementsByTagName("Type")[0].childNodes[0].nodeValue != category) {
			continue;
		}
		if (!showPeasant && _weapons[keys[k]].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
			continue;
		}
		if (!showMisc && _weapons[keys[k]].getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes") {
			continue;
		}
		
		// Create div for option, add image for point cost and name
		weapName = _weapons[keys[k]].getElementsByTagName("Name")[0].childNodes[0].nodeValue;
		pointCost = _weapons[keys[k]].getElementsByTagName("Points")[0].childNodes[0].nodeValue;
		optionElement = document.createElement("div");
		optionImg = document.createElement("div");
		optionImg.setAttribute("class", "optionImg");
		optionImg.style.backgroundImage = "url(\"img/icons/pointsNull.png\")";
		costText = document.createElement("span");
		costText.setAttribute("class", "costText");
		costText.innerHTML = pointCost;
		optionImg.append(costText);
		optionText = document.createElement("span");
		optionText.setAttribute("class", "optionText");		
		optionText.innerHTML = weapName;
		optionElement.appendChild(optionImg);
		optionElement.appendChild(optionText);

		if (sortMethod == "points") {
			// Get point costs for each weapon, then push that element to the appropriate spot in the array
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
		
		selectedName = weaponLists[l].getElementsByClassName("listInput")[0].value;
		if (sortMethod == "points") {
			// Create 2D array: [point cost][weapon]
			var points;
			var buffer = new Array(Max_Cost+1);
			for (a=0; a<Max_Cost+1; a++) {
				buffer[a] = new Array();
			}
			
			// Get the point cost of each weapon, then push that weapon's element
			// to the corresponding array within the buffer array
			for (n=0; n<options.length; n++) {
				buffer[pointCosts[n]].push(options[n]);
			}
	
			// Append the sum of the buffer arrays to the listItems element
			// _weapons array is sorted upon page load so this will automatically be sorted.
			for (x=0; x<Max_Cost+1; x++) {
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
					
					// Add event listeners to change weapon when clicked, and to remove the predictive highlighting
					// when another element is moused over
					buffer[x][y].addEventListener("click", function(e) {
						closeList(this.parentNode.parentNode.querySelector(".listItems"));
						changeWeapon(this);
					});
				/*	buffer[x][y].addEventListener("mouseover", function(){
						var pred = this.parentNode.querySelector(".predicted");
						if (pred != null) pred.classList.remove("predicted");
					}); */
					newList.appendChild(buffer[x][y]);
					dummyOption = buffer[x][y].cloneNode(true);
					dummyOption.setAttribute("class", "dummyOption");
					newDummy.appendChild(dummyOption);
				}
			}
		} else if (sortMethod == "name") {
			// Options are sorted on page load, so simply reappend them to the list in order
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
				
				// Add event listeners to change weapon when clicked, and to remove the predictive highlighting
				// when another element is moused over
				options[o].addEventListener("click", function(){
					closeList(this.parentNode.parentNode.querySelector(".listItems"));
					changeWeapon(this);
				});
			/*	options[o].addEventListener("mouseup", function(){
					var pred = this.parentNode.querySelector(".predicted");
					if (pred != null) pred.classList.remove("predicted");
				}); */
				newList.appendChild(options[o]);
				dummyOption = options[o].cloneNode(true);
				dummyOption.setAttribute("class", "dummyOption");
				newDummy.appendChild(dummyOption);
			}
			
		} else {
			alert("Error 6");
			return;
		}
		
		// Add dummies and "No weapons found" option
		var noneDummy = dummyOption.cloneNode(true), noneOption;
		noneDummy.setAttribute("class", "dummyOption noneOption");
		newDummy.appendChild(noneDummy);
		noneOption = noneDummy.cloneNode(true);
		noneOption.querySelector(".optionText").innerHTML = "No results found";
		noneOption.setAttribute("class", "listOption noneOption");
		newList.appendChild(noneOption);
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

/** function onDModBlur(mod)
 * Checks the input field for the damage modifier to make sure it is a number in the accepted range.
 * Displays a message if the input is not valid, and reverts the value to the placeholder (aka the previous value)
 * if the input is invalid or blank.
 * @param mod : The damage modifier input element
 * @returns : Nothing
 */
function onDModBlur(mod) {
	if (mod.value == "") {
		mod.value = mod.placeholder;
		return;
	} else if (!isNumber(mod.value) || Number(mod.value) <=0 || Number(mod.value) > 5) {
		// If input is invalid, reset the value to the previous placeholder (which can only be valid)
		// and temporarily show the error notification helper
		mod.value = mod.placeholder;
		document.getElementById("dModHelper").classList.remove("helpHide", "invisible");
		setTimeout(function() {
			document.getElementById("dModHelper").classList.add("helpHide");
		}, 210);
		return;
	}

	// If valid input and not equal to 1, display warning that damage has been modified under damage table
	document.getElementById("dModHelper").classList.add("helpHide", "invisible");
	document.getElementById("dMod").innerHTML = mod.value;
	if (Number(mod.value) == 1) {
		document.getElementById("dModWarning").classList.add("invisible");
	} else {
		document.getElementById("dModWarning").classList.remove("invisible");
	}
	
	mod.value = Number(mod.value).toFixed(2);
	setCookie("dMod", String(mod.value));
	var lName = document.getElementById("weaponLeft").getElementsByClassName("listInput")[0].value;
	var rName = document.getElementById("weaponRight").getElementsByClassName("listInput")[0].value;
	updateStats("Left", lName);
	updateStats("Right", rName);
}

/** function onDModFocus(mod)
 * Function to be run when the input field for the damage modifier setting is focused;
 * Replaces placeholder with current value and clears current value for new entry.
 * @param mod : The damage modifier input element
 * @returns : Nothing
 */
function onDModFocus(mod) {
	mod.placeholder = mod.value;
	mod.value = "";
}

function onDModPress(input, event) {
	if (event.code == "Enter" || event.code == "NumpadEnter") {
		input.blur();
	}
}

/** function onSelBlur(input)
 * Function to be run when focus for the input field for a currently selected weapon is lost;
 * Clears input value for smoother transitions
 * @param input : The input element for the currently selected weapon
 * @returns : Nothing
 */
function onSelBlur(input) {
	var list = input.parentNode.parentNode.querySelector(".listItems");

	if (list.classList.contains(".menuHide")) {
		input.value = " ";
	} else {
	}
}

/** function onSelFocus(input)
 * This function is manually run to put focus on the provided input and open it's corresponding list
 * @param input : The .listInput element
 * @returns : Nothing
 */
function onSelFocus(input) {
	_lastFocus = input;
	setTimeout(function(){
		openList(input.parentNode.parentNode.querySelector(".listItems"));
	}, 10);
}

/** function onSelPress(input, event)
 * Function to be run on key press in a weapon input field
 * Checks to see if the enter key has been pressed; if so, checks if the current value is a valid weapon,
 * then changes the weapon if true.
 * @param input : The input field
 * @param event : The event handler
 * @returns : Nothing
 */
function onSelPress(input, event) {
	var listOpts, selNode, nextNode, prevValue;
	if (event.code == "Enter") {
		// Check if one of the list options is selected via autosuggest or navigation
		// If so, close list and change weapon
		selNode = input.parentNode.parentNode.querySelector(".predicted, .nav");
		if (!selNode) return;
		closeList(input.parentNode.parentNode.querySelector(".listItems"));
		changeWeapon(selNode);
	} else if (event.code == "ArrowDown") {
		// First check for predicted/navigated option, then check for the currently selected option if it's visible.
		// If none of those exist, select the first available visible option (if it is not the .noneOption) and skip ahead.
		selNode = input.parentNode.parentNode.querySelector(".predicted, .nav");
		if (!selNode) selNode = input.parentNode.parentNode.querySelector(".currSelected:not(.invisible)");
		if (!selNode) {
			nextNode = input.parentNode.parentNode.querySelector(".listOption:not(.invisible)");
			if (nextNode.classList.contains("noneOption")) return;
			nextNode.classList.add("nav");
		} else {
			selNode.classList.remove("predicted", "nav");
			nextNode = selNode;
			// Skip over invisible options
			while (nextNode.nextElementSibling != null && !nextNode.nextElementSibling.classList.contains("noneOption")) {
				nextNode = nextNode.nextElementSibling;
				if (!nextNode.classList.contains("invisible")) break;
			}
			if (nextNode.classList.contains("invisible")) nextNode = selNode;
			nextNode.classList.add("nav");
			// Scroll list if necessary
			if (nextNode.parentNode.scrollTop < nextNode.offsetTop - (nextNode.parentNode.offsetHeight - nextNode.offsetHeight*2)) {
				nextNode.parentNode.scrollTop += nextNode.offsetHeight;
			}
		}
		// If no options exist at all, return
		if (!nextNode) return;
		// Autosuggest
		prevValue = input.value.substring(0, input.selectionStart).toLowerCase();
		input.value = nextNode.querySelector(".optionText").innerHTML;
		input.setSelectionRange(0, input.value.length);
		setTimeout(function() {
			input.setSelectionRange(0, input.value.length);
		}, 0);
	} else if (event.code == "ArrowUp") {
		// First check for predicted/navigated option, then check for the currently selected option if it's visible.
		// If none of those exist, do nothing.
		selNode = input.parentNode.parentNode.querySelector(".predicted, .nav");	
		if (!selNode) selNode = input.parentNode.parentNode.querySelector(".currSelected:not(.invisible)");
		if (!selNode) return;
		else {
			selNode.classList.remove("predicted", "nav");
			nextNode = selNode;
			// Skip over invisible options
			while (nextNode.previousElementSibling != null) {
				nextNode = nextNode.previousElementSibling;
				if (!nextNode.classList.contains("invisible")) break;
			}
			if (nextNode.classList.contains("invisible")) nextNode = selNode;
			nextNode.classList.add("nav");
			// Scroll list if necessary
			if (nextNode.parentNode.scrollTop > nextNode.offsetTop - nextNode.offsetHeight*2) {
				nextNode.parentNode.scrollTop -= nextNode.offsetHeight;
			}
		}
		// Autosuggest
		prevValue = input.value.substring(0, input.selectionStart).toLowerCase();
		input.value = nextNode.querySelector(".optionText").innerHTML;
		input.setSelectionRange(0, input.value.length);
		setTimeout(function() {
			input.setSelectionRange(0, input.value.length);
		}, 0);
	}
}

/** function openList(list)
 * Opens the provided list
 * @param list : The .listItems element
 * @returns : Nothing
 */
function openList(list) {
	if (list != null && !list.classList.contains("menuHide")) return;
	
	var dummyList = list.parentNode.querySelector(".dummyList");
	list.querySelector(".noneOption").style.display = "none";
	dummyList.querySelector(".noneOption").style.display = "none";
	list.classList.remove("menuHide");
	dummyList.classList.remove("menuHide");
	
	// Scroll currently selected weapon into view
	var currSel = list.querySelector(".currSelected");
	list.scrollTop = currSel.offsetTop - (list.offsetHeight/2 - currSel.offsetHeight);
	
	// Disable scrolling infobox when list is open (mostly for mobile)
	if (_mobile) document.getElementById("infoBox").style.overflowY = "hidden";
}

/** function populateLists(cat, params)
 * Creates drop-down lists for equipment names (depending upon category)
 * @param cat : The category of equipment (Ranged, Melee, Shield, or None) to populate lists with
 * @param params : The parameters as an associative array, or an empty String if there are none
 * @returns : Nothing
 */
function populateLists(cat, params) {
	var leftName, rightName;
	
	if (cat == "None" && typeof(params) == "object") {
		// This runs if the page URL contains parameters for weapons 
		try {
			// Get weapon parameters and decode so that they match weapon names exactly
			var weaps = params["w"].split("+");
			leftName = decodeURIComponent(weaps[0]).replace("_", " ");
			rightName = decodeURIComponent(weaps[1]).replace("_", " ");
			var leftCat = _weapons[leftName].getElementsByTagName("Type")[0].childNodes[0].nodeValue;
			var rightCat = _weapons[rightName].getElementsByTagName("Type")[0].childNodes[0].nodeValue;
			
			if (leftCat != rightCat) {
				// Check for weapon category mismatch
				alert("Error: invalid comparison");
				window.location.replace("/");
				return;
			} else {
				cat = leftCat;
				var oldCat = document.getElementsByClassName("catActive")[0];
				var newCat = document.getElementById(cat.toLowerCase() + "Button");
				oldCat.classList.remove("catActive");
				oldCat.disabled = false;
				newCat.classList.add("catActive");
				newCat.disabled = true;
			}
		} catch (e) {
			alert("Error: invalid weapon parameters");
			window.location.replace("/");
			return;
		}
		
		if (_weapons[leftName].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes"
			|| _weapons[rightName].getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
			document.getElementById("peasantBtn").classList.add("checked");
		}
		if (_weapons[leftName].getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes"
			|| _weapons[rightName].getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes") {
			document.getElementById("miscBtn").classList.add("checked");
		}
		
		setTypeOptions("Left", leftName);
		setTypeOptions("Right", rightName);
		
		if (cat == "Melee" && params["m"] != null) {
			try {
				// Get attack mode parameters and set them on page
				var modes = ["Strike", "Stab", "Alt Strike", "Alt Stab", "Melee Throw"];
				var modeParams = params["m"].split("+");
				for (x=0; x<2; x++) {
					if (modes[modeParams[x]-1].includes("Stab")) {
						document.getElementsByClassName("attButton")[2*x].classList.replace("strikeSel", "strikeUnsel");
						document.getElementsByClassName("attButton")[2*x+1].classList.replace("stabUnsel", "stabSel");
					}
					if (modes[modeParams[x]-1].includes("Alt")) {
						document.getElementsByClassName("altButton")[x].classList.replace("altUnsel", "altSel")
					}
					if (modes[modeParams[x]-1] == "Melee Throw") {
						document.getElementsByClassName("attButton")[2*x].classList.replace("strikeSel", "strikeUnsel");
						document.getElementsByClassName("altButton")[x].classList.replace("altUnsel", "altSel");
					} 
				}
			} catch (e) {
				alert("Error: invalid attack mode parameters");
				setTypeOptions("Left", leftName);
				setTypeOptions("Right", rightName);
			}
		}
	} else if (cat == "Melee" || cat == "Ranged" || cat == "Shield") {
		// No parameters have been passed; randomly select XML node for 2 weapons of provided category
		leftName = getNewDefault();
		rightName = getNewDefault();
		while (leftName == rightName) {
			rightName = getNewDefault();
		}
		setTypeOptions("Left", leftName);
		setTypeOptions("Right", rightName);
	} else {
		alert("Error: invalid category");
		return;
	}

	var selected = document.getElementsByClassName("listInput");
	selected[0].value = leftName;
	selected[1].value = rightName;
	
	makeLists();
	
	// Update everything for new category and weapons
	_categoryChanged = true;
	updateStats("Left", leftName);
	updateStats("Right", rightName);
}

/** function setCookie(key, value)
 * Sets or replaces a cookie
 * @param key : Cookie name
 * @param value : Cookie value
 * @returns : Nothing
 */
function setCookie(key, value) {
	var date30Yr = new Date();
	date30Yr.setTime(date30Yr.getTime() + (365*30*24*60*60*1000));
	document.cookie = key+"="+value+";expires="+date30Yr.toUTCString()+";path=/";
}

/** function setHiddenElements()
 * Shows/hides speed and general stat elements based on what data is being displayed.
 * @returns : Nothing
 */
function setHiddenElements() {
	var speedRows = document.getElementById("speedTable").getElementsByTagName("tr");
	var speedTitle = document.getElementById("speedTitle");
	var speedBox = document.getElementById("speed");
	var speedValues, noSpeed = true;
	
	for (i=0; i<speedRows.length; i++) {
		speedValues = speedRows[i].getElementsByClassName("speedValue");
		
		if (!speedValues[0].classList.contains("emptyStat") || !speedValues[1].classList.contains("emptyStat")) {
			speedRows[i].classList.remove("invisible");
			noSpeed = false;
		} else {
			speedRows[i].classList.add("invisible");
		}
	}
	
	if (noSpeed) {
		speedTitle.classList.add("invisible");
		speedBox.classList.add("invisible");
	} else {
		speedTitle.classList.remove("invisible");
		speedBox.classList.remove("invisible");
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
 * Sets the images to the requested weapon on the provided side
 * @param side : The side to set the image on
 * @param name : The name of the weapon (should match image name exactly)
 * @returns : Nothing
 */
function setImage(side, name) {
	var images;
	if (side == "Left") {
		images = document.getElementsByClassName("imageLeft");
		for (i=0; i<images.length; i++) {
			images[i].src = "img/weapons/" + name + ".png";
		}
	} else if (side == "Right") {
		images = document.getElementsByClassName("imageRight");
		for (i=0; i<images.length; i++) {
			images[i].style.backgroundImage = "url(\"img/weapons/" + name + ".png\")";
		}
	} else {
		alert("Error 2");
	}
}

/** function setTypeOptions(side, weapon)
 * Resets attack type options on the provided side and enables/disables all buttons
 * depending on if it is a melee or ranged weapon
 * @param side : The side
 * @param weapon : The name of the weapon
 * @returns : Nothing
 */
function setTypeOptions(side, weapon) {
	var categoryButtons = document.getElementById("categoryBar").getElementsByTagName("button");
	var typeButtons = document.getElementById("attType"+side).getElementsByTagName("button");
	var attacks = _weapons[weapon].getElementsByTagName("Attack");
	var leftDiv = document.getElementsByClassName("statHalf")[0];
	
	if (categoryButtons[0].classList.contains("catActive")) {
		// If category is melee, enable buttons and default to Strike
		for (i=0; i<typeButtons.length; i++) {
			typeButtons[i].disabled = false;
		}
		leftDiv.classList.remove("shieldStats");
		typeButtons[0].setAttribute("class", "strikeSel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		
		if (attacks.length == 1) {
			// Kick
			for (i=0; i<typeButtons.length; i++) {
				typeButtons[i].disabled = true;
			}
			typeButtons[0].setAttribute("class", "strikeUnsel attButton");
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		} else if (attacks.length == 2) {
			// Melee no alt
			typeButtons[2].disabled = true;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		} else {
			// Normal melee or thrown melee
			typeButtons[2].disabled = false;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.remove("altDisabled");
		}
	} else if (categoryButtons[1].classList.contains("catActive")) {
		// If category is Ranged, disable and unselect all attack type buttons
		for (i=0; i<typeButtons.length; i++) {
			typeButtons[i].disabled = true;
		}
		leftDiv.classList.remove("shieldStats");
		typeButtons[0].setAttribute("class", "strikeUnsel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
	} else {
		// If category is Shield, disable and unselect all attack type buttons and hide speed/damage tables
		for (i=0; i<typeButtons.length-1; i++) {
			typeButtons[i].disabled = true;
		}
		typeButtons[0].setAttribute("class", "strikeUnsel attButton");
		typeButtons[1].setAttribute("class", "stabUnsel attButton");
		typeButtons[2].setAttribute("class", "altUnsel altButton");
		
		// If both shields are not displaying thrown stats, hide damage table, otherwise show
		if (getAttackType("Left") == "Shield" && getAttackType("Right") == "Shield") leftDiv.classList.add("shieldStats");
		else leftDiv.classList.remove("shieldStats");
		
		if (attacks.length == 1) {
			// If shield does not have a thrown option, disable alt button.  Otherwise enable
			typeButtons[2].disabled = true;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		} else {
			typeButtons[2].disabled = false;
			typeButtons[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.remove("altDisabled");
		}
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
	
	updateStats(getElementSide(btn), document.getElementById("weapon"+getElementSide(btn)).getElementsByClassName("listInput")[0].value);
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
	
	populateLists(cat, "");
}

/** function toggleAltMode(btn)
 * Toggles the alt mode on/off for the clicked side
 * @param btn : The button being clicked
 * @returns : Nothing
 */
function toggleAltMode(btn) {	
	var side, weaponData;
	side = getElementSide(btn);
	var attackModeButtons = btn.parentNode.parentNode.parentNode.getElementsByClassName("attButton");
	
	if (btn.classList.contains("altSel")) {
		btn.classList.replace("altSel", "altUnsel");
		if (getCategory() == "Shield") {
			if (getAttackType("Left") == "Shield" && getAttackType("Right") == "Shield") {
				document.getElementById("stats").querySelector(".statHalf").classList.add("shieldStats");
			}
		} else if (attackModeButtons[0].classList.contains("strikeUnsel") && attackModeButtons[1].classList.contains("stabUnsel")) {
			// If both strike and stab were unselected,
			// then this alt was a melee throw and it should default to/reselect Strike
			attackModeButtons[0].classList.replace("strikeUnsel", "strikeSel");
		}
		
	} else {
		btn.classList.replace("altUnsel", "altSel");
		weaponData = _weapons[document.getElementById("weapon"+side).getElementsByClassName("currSelected")[0].getElementsByClassName("optionText")[0].innerHTML];
		if (getCategory() == "Shield") {
			document.getElementById("stats").querySelector(".statHalf").classList.remove("shieldStats");
		} else if(weaponData.getElementsByTagName("AttackType")[2].childNodes[0].nodeValue == "Melee Throw") {
			// If the third attack type node for the weapon data is "Melee Throw"
			// then this alt is a melee throw and it should deselect both strike and stab buttons
			attackModeButtons[0].classList.replace("strikeSel", "strikeUnsel");
			attackModeButtons[1].classList.replace("stabSel", "stabUnsel");
		}
	}

	currWeapElem = document.getElementById("weapon"+side).getElementsByClassName("currSelected")[0];
	updateStats(side, currWeapElem.getElementsByClassName("optionText")[0].innerHTML);
}

/** function toggleChanges(event)
 * Toggles the changelog menu on/off and closes other open lists/menus
 * @param event : The event handler attached to this function
 * @returns : Nothing
 */
function toggleChanges(event) {
	event.stopPropagation();
	var menu = document.getElementById("changelog");
	if (menu.classList.contains("menuHide")) {
		closeMenus();
		menu.classList.remove("menuHide");
	} else {
		closeMenus();
	}
	
	var ping = document.getElementById("logPing");
	ping.classList.add("invisible");
	setCookie("lastVersion", ping.innerHTML);
}

/** function toggleClassic(btn)
 * Toggles display of either the classic or alt damage table
 * @param btn : The button for this toggle
 * @returns : Nothing
 */
function toggleClassic(btn) {
	var damageDiv = document.getElementById("damage");
	var altTable = damageDiv.querySelector(".damageTable.alt");
	var classicTable = damageDiv.querySelector(".damageTable:not(.alt)");
	var statHalves = document.getElementsByClassName("statHalf");
	var tagToggleWrapper = btn.parentNode.parentNode.nextElementSibling;

	if (altTable.classList.contains("invisible")) {
		classicTable.classList.add("invisible");
		document.body.classList.add("expanded");
		statHalves[0].classList.add("expanded");
		statHalves[1].classList.add("expanded");
		statHalves[1].classList.remove("permTags");
		altTable.classList.remove("invisible");
	} else {
		altTable.classList.add("invisible");
		statHalves[0].classList.remove("expanded");
		statHalves[1].classList.remove("expanded");
		if (tagToggleWrapper.querySelector("button").classList.contains("checked")) {
			statHalves[1].classList.add("permTags");
		} else {
			document.body.classList.remove("expanded");
		}
		classicTable.classList.remove("invisible");
	}
	
	btn.classList.toggle("checked");
	tagToggleWrapper.classList.toggle("off");
	setCookie("classicOn", btn.classList.contains("checked"));
}

/** function toggleCompOpts(event, close)
 * Toggles display of the comparison options dropdown
 * @param event : The event handler attached to this function
 * @param close : Optional parameter; if given "close", function will close the dropdown menu instead of toggling
 * @returns : Nothing
 */
function toggleCompOpts(event, close) {
	event.stopPropagation();
	var list = document.getElementById("compItems");
	if (close == "close") list.classList.add("menuHide");
	else list.classList.toggle("menuHide");
}

/** function toggleFAQ(event)
 * Toggles the FAQ menu on/off and closes Known Issues menu if open
 * @param event : The event handler attached to this function
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
 * @param event : The event handler attached to this function
 * @returns : Nothing
 */
function toggleHelp(event) {
	event.stopPropagation();
	var menu = document.getElementById("helpMenu");
	if (menu.classList.contains("menuHide")) {
		closeMenus();
		menu.classList.remove("menuHide");
	} else {
		closeMenus();
	}
}

/** function toggleHelperText(event, helper)
 * Toggles the helper text for the given helper
 * @param helper : The helper
 * @param event : The event handler
 * @returns : Nothing
 */
function toggleHelperText(event, helper) {
	event.stopPropagation();
	helper.parentNode.querySelector(".popText").classList.toggle("popHide");
}

/** function toggleHuntsman(btn)
 * Toggles the modification of damage values to reflect huntsman perk
 * @param btn : The corresponding button
 * @returns : Nothing
 */
function toggleHuntsman(btn) {
	event.stopPropagation();
	btn.classList.toggle("checked");
	setCookie("huntOn", String(btn.classList.contains("checked")));
	document.getElementById("huntWarning").classList.toggle("invisible");
	
	var weaponListElems = document.getElementsByClassName("weaponList");
	var wName;
	wName = weaponListElems[0].getElementsByClassName("listInput")[0].value;
	updateStats("Left", wName);
	wName = weaponListElems[1].getElementsByClassName("listInput")[0].value;
	updateStats("Right", wName);
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


/** function toggleList(list, event)
 * Opens/closes the given listItems element
 * @param list : The .listItems element
 * @param event : The event handler calling this function
 * @returns : Nothing
 */
function toggleList(list) {
	var input = list.parentNode.querySelector(".listInput");
	if (list.classList.contains("menuHide")) focusInput(input);
	else {
		setTimeout(function(){
			input.blur();
			input.value = list.querySelector(".currSelected > .optionText").innerHTML;
		}, 0);
		closeList(list);
	}
}

/** function toggleMisc(btn)
 * Toggles the display of miscellaneous weapons
 * @param btn : The button for this toggle
 * @returns : Nothing
 */
function toggleMisc(btn) {
	btn.classList.toggle("checked");
	setCookie("miscOn", btn.classList.contains("checked"));

	var weaps = document.getElementsByClassName("listInput");
	var dataLeft = _weapons[weaps[0].value];
	var dataRight = _weapons[weaps[1].value];
	
	var newLeft, newRight, newListOpt, listOpts;
	var listOptsLeft = document.getElementById("weaponLeft").getElementsByClassName("listOption");
	var listOptsRight = document.getElementById("weaponRight").getElementsByClassName("listOption");

	// If a weapon is misc and misc weapons are being disabled, set a new weapon
	if (!btn.classList.contains("checked") && dataLeft.getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes") {
		newLeft = getNewDefault();
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
	if (!btn.classList.contains("checked") && dataRight.getElementsByTagName("Misc")[0].childNodes[0].nodeValue == "Yes") {
		if (newLeft == null) {
			newRight = getNewDefault();
		} else {
			// If both weapons were peasant when show peasant button is disabled,
			// make sure new weapons aren't the same
			do {
				newRight = getNewDefault();
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

/** function togglePeasant(btn)
 * Toggles the display of peasant weapons
 * @param btn : The button for this toggle
 * @returns : Nothing
 */
function togglePeasant(btn) {
	btn.classList.toggle("checked");
	setCookie("peasOn", btn.classList.contains("checked"));

	var weaps = document.getElementsByClassName("listInput");
	var dataLeft = _weapons[weaps[0].value];
	var dataRight = _weapons[weaps[1].value];
	
	var newLeft, newRight, newListOpt, listOpts;
	var listOptsLeft = document.getElementById("weaponLeft").getElementsByClassName("listOption");
	var listOptsRight = document.getElementById("weaponRight").getElementsByClassName("listOption");

	// If a weapon is peasant-only and peasant-only weapons are being disabled, set a new weapon
	if (!btn.classList.contains("checked") && dataLeft.getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
		newLeft = getNewDefault();
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
	if (!btn.classList.contains("checked") && dataRight.getElementsByTagName("PeasantOnly")[0].childNodes[0].nodeValue == "Yes") {
		if (newLeft == null) {
			newRight = getNewDefault();
		} else {
			// If both weapons were peasant when show peasant button is disabled,
			// make sure new weapons aren't the same
			do {
				newRight = getNewDefault();
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
	var buttons = btn.parentNode.parentNode.parentNode.getElementsByTagName("button");
	if (btn.classList.contains("checked")) {
		// Don't respond to click on checked element
		return;
	} else {
		buttons[0].classList.toggle("checked");
		buttons[1].classList.toggle("checked");
	}
	
	if (buttons[0].classList.contains("checked")) setCookie("sortBy", "name");
	else setCookie("sortBy", "points");
	
	makeLists();
}

/** function toggleTags(btn)
 * Toggles permanent display of the damage table nametags
 * @param btn : The button for this toggle
 * @returns : Nothing
 */
function toggleTags(btn) {
	if (btn.parentNode.parentNode.classList.contains("off")) return;
	var tags = document.getElementById("damage").querySelectorAll(".damageTable:not(.alt) .damRibbon");
	var statHalves = document.getElementsByClassName("statHalf");
	var classicTable = document.getElementById("damage").querySelector(".damageTable:not(.alt)");
	btn.classList.toggle("checked");
	
	if (btn.classList.contains("checked")) {
		for (t=0; t<tags.length; t++) {
			tags[t].classList.add("permRibbon");
		}
		classicTable.classList.add("permTags");
		statHalves[1].classList.add("permTags");
		document.body.classList.add("expanded");
		setCookie("tagsOn", "true")
	} else {
		for (t=0; t<tags.length; t++) {
			tags[t].classList.remove("permRibbon");
		}
		classicTable.classList.remove("permTags");
		statHalves[1].classList.remove("permTags");
		document.body.classList.remove("expanded");
		setCookie("tagsOn", "false");
	}
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
	var huntMods = { "Crossbow":3, "Longbow":3, "1411":3, "Recurve Bow":2.3, "Other":1.75 }; // Damage modifiers for hunstman
	
	// Get XML data for current weapon
	var weaponData = _weapons[name];
	
	// Get provided side and other side's selected attack types
	var attackType, otherAttackType, otherSide;
	attackType = getAttackType(side);
	
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
	
	// Set damage modifier if huntsman is enabled
	var huntsmanOn = document.getElementById("huntBtn").classList.contains("checked");
	var huntMod = 1;
	if (huntsmanOn) {
		if (huntMods.hasOwnProperty(name)) {
			huntMod = huntMods[name];
		} else if (attackType == "Ranged" || attackType == "Melee Throw") {
			huntMod = huntMods["Other"];
		}
	}
	
	// Get global damage modifier
	var damageMod = Number(document.getElementById("damageField").value);
	
	// Get the Attack XML node
	var attacks, attackNode;
	var attacks = weaponData.getElementsByTagName("Attack");
	if (attacks[0].getElementsByTagName("AttackType")[0].childNodes[0].nodeValue == "Kick") {
		// A bit hacky but kick needs to be handled differently
		attackNode = attacks[0];
	} else {
		for (i=0; i<attacks.length; i++) {
			if (attacks[i].getElementsByTagName("AttackType")[0].childNodes[0].nodeValue == attackType) {
				attackNode = attacks[i];
			}
		}
	}
	
	if (attackNode == null) {
		alert("\""+attackType+"\" data for " + name + " does not exist.");
		setTypeOptions(side, name);
		attackNode = attacks[0];
	}
	if (attackNode == null) {
		alert("Error uS1284");
		window.location.replace("/");
	}
	
	// Update damage table
	var row;
	var s = side.charAt(0); // Gives "L" or "R"; for convenience
	var otherS = otherSide.charAt(0);
	var bodyPart; // Will hold body part
	var b; // Will hold letter corresponding to body part
	var damElem, dividerBG;
	var tables = document.getElementsByClassName("damageTable");
	
	for (t=0; t<tables.length; t++) {
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
			damElem = tables[t].querySelector(".a"+col+b+s);
			compElem = damElem.nextElementSibling;
			otherCompElem = tables[t].querySelector(".a"+col+b+otherS).nextElementSibling;
			dividerBG = damElem.parentNode.previousElementSibling;
			// Clear damage table
			damElem.parentNode.classList.remove("emptyDam", "damageNeg", "damageLow", "damageMedLow", "damageMed",
												"damageMedHigh", "damageHigh");
			if (dividerBG != null) dividerBG.setAttribute("class", "damageDiv bg "+side.toLowerCase());
			
			try {
				// If requested XML node does not exist or is empty, this will fail and set damElem to "-"
				var damage = 0;
				damage = damageMod * attackNode.getElementsByTagName(bodyPart)[0].getElementsByTagName("Armor"+col)[0].childNodes[0].nodeValue;
				if (huntsmanOn && bodyPart != "Legs"
					&& (attackType == "Ranged" || attackType == "Melee Throw")) {
					damage *= huntMod;
					damage = +Number.parseInt(damage);
				}
				damage = +damage.toFixed(1);
				damElem.innerHTML = damage;
			} catch (e) {
				damElem.innerHTML = "–";
			}
			
			if (damElem.innerHTML >= 100) {
				damElem.parentNode.classList.add("damageHigh");
				if (dividerBG != null) dividerBG.classList.add("damageHigh");
			} else if (damElem.innerHTML >= 50) {
				damElem.parentNode.classList.add("damageMedHigh");
				if (dividerBG != null) dividerBG.classList.add("damageMedHigh");
			} else if (damElem.innerHTML >= 34) {
				damElem.parentNode.classList.add("damageMed");
				if (dividerBG != null) dividerBG.classList.add("damageMed");
			} else if (damElem.innerHTML >= 25) {
				damElem.parentNode.classList.add("damageMedLow");
				if (dividerBG != null) dividerBG.classList.add("damageMedLow");
			} else if (damElem.innerHTML >= 0) {
				damElem.parentNode.classList.add("damageLow");
				if (dividerBG != null) dividerBG.classList.add("damageLow");
			} else if (damElem.innerHTML < 0) {
				damElem.parentNode.classList.add("damageNeg");
				if (dividerBG != null) dividerBG.classList.add("damageNeg");
			} else {
				damElem.parentNode.classList.add("emptyDam");
				if (dividerBG != null) dividerBG.classList.add("emptyDam");
			}
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
		if (speedNodes == null || speedNodes[nodeCount] == null) { // Thrown melee weapon does not have speed stats
			document.getElementById(spTitleName+side).innerHTML = "N/A";
			document.getElementById(spTitleName+side).classList.add("emptyStat");
		} else if (speedNodes[nodeCount].childNodes[0].nodeValue.includes("-")) {
			document.getElementById(spTitleName+side).innerHTML = "N/A";
			document.getElementById(spTitleName+side).classList.add("emptyStat");
			nodeCount++;
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
				&& genNodes[nodeCount].childNodes[0] != null) {
				// If current stat matches the current XML tag and has data
			if (genNodes[nodeCount].childNodes[0].nodeValue == "-") {
				document.getElementById(genTitles[i].id+s).innerHTML = "N/A";
				document.getElementById(genTitles[i].id+s).classList.add("emptyStat");
			} else if (genTitles[i].id == "Length") {
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

	// sekrit
	var alt = document.getElementById(`attType${side}`).querySelector(".altText");
	if (name == "Pole Axe") {
		alt.classList.add("paxe");
		var paxe_bb = document.createElement("div");
		var pI = document.createElement("img");
		pI.setAttribute("src", "/img/gg_dating_sim.png");
		alt.onclick = function(event) {
			paxe_bb.style.opacity = 0;
			paxe_bb.id = "paxe_bb";
			paxe_bb.appendChild(pI);
			document.body.appendChild(paxe_bb);
			paxe_bb.addEventListener("click", function(event) { if (event.target.tagName == "DIV") paxe_bb.remove(); });
			setTimeout(function(){paxe_bb.style.opacity = 1;}, 100);
		};
	} else {
		alt.onclick = null;
		alt.classList.remove("paxe");
	}

	setImage(side, name);
	// Do not set hidden elements or attempt to draw comparisons if the weapon category has just
	// been changed or set, as on the first update there will not be any stats on the other side yet.
	if (_categoryChanged) {
		_categoryChanged = false;
		return;
	}
	
	setHiddenElements();
	if (document.getElementById("compSel").innerHTML != "None") {
		compare();
	}
}