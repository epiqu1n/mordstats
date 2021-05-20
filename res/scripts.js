/**
 * @typedef Weapon
 * @prop {string} type
 * @prop {number} pointCost
 * @prop {Attack[]} attacks
 * @prop {boolean} peasantOnly
 * @prop {boolean} isMisc
 */

/**
 * @typedef Attack
 * @prop {string} type
 * @prop {AttackDamage?} damage
 * @prop {AttackSpeed?} speed
 * @prop {{}} general
 * @prop {number} huntsmanModifier
 */

/**
 * @typedef AttackDamage
 * @prop {number[]} torso
 * @prop {number[]} head
 * @prop {number[]} legs
 */

/** 
 * @typedef AttackSpeed
 * @prop {number?} windup
 * @prop {number?} combo
 * @prop {number?} release
 * @prop {number?} recovery
 * @prop {number?} draw
 * @prop {number?} reload
 */

/** @type {{[name: string]: Weapon}[]} */ const _weaponSets = [];
/** @type {number[]} */ const _weapNums = [];
/** @type {boolean} */ let _categoryChanged;
/** @type {HTMLInputElement} */ let _lastFocus;
/** @type {number} */ let _lastX;
/** @type {number} */ let  _xMove;
/** @type {HTMLDivElement} */ let _mainBody;
/** @type {number} */ let _animTimeout;
/** @type {boolean} */ let _mobile;
/** @type {NodeListOf<Element>} */ let _tooltips;

const TANK_PERK_MOD = 0.71;
const MAX_COST = 33;

///
/// Class declarations
///
class MordXMLRequest {
	/**
	 * 
	 * @param {string} filePath 
	 * @param {((response: string)=>void)} onLoad 
	 */
	constructor(filePath, onLoad = null) {
		this.request = new XMLHttpRequest();
		this.fileName = filePath.substring(filePath.lastIndexOf("/") + 1);

		this.request.onreadystatechange = (event) => {
			if (this.request.readyState === 4 && this.request.status === 200) {
				console.log(`${this.fileName} loaded successfully`);
				
				if (onLoad) onLoad(this.request.responseText);
			} else if (this.request.readyState === 3 && this.request.status === 404) {
				console.error(`An error occurred loading ${this.fileName}`);
			}
		};
		
		this.request.onerror = (event) => {
			console.error(`An error occurred loading ${this.fileName}`);
			console.error(this.request.statusText);
		};
		
		this.request.open("GET", filePath);
		this.request.setRequestHeader('cache-control', 'no-cache, must-revalidate, post-check=0, pre-check=0');
		this.request.setRequestHeader('cache-control', 'max-age=0');
		this.request.setRequestHeader('expires', '0');
		this.request.setRequestHeader('expires', 'Tue, 01 Jan 1980 1:00:00 GMT');
		this.request.setRequestHeader('pragma', 'no-cache');
		this.request.responseType = 'text';
		this.request.send();
	}
}


///
/// On load
///
function onPageLoad() {
	// Define global variables
	_mainBody = document.getElementById("mainBody");
	_categoryChanged = true;
	_lastFocus = document.getElementById("weaponRight").querySelector(".listInput");
	_mobile = false;
	_tooltips = document.querySelectorAll(".toolSrc + .tooltip");
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
			
	// Add event listener to have tooltip(s) follow mouse pointer
	window.onmousemove = function(event) {
		var x = event.clientX, y = event.clientY;
		
		for (var t=0; t<_tooltips.length; t++) {
			if (_tooltips.item(t).matches(".toolSrc:hover + .tooltip")) {
				if ((x + 14 + _tooltips.item(t).offsetWidth) > window.innerWidth) {
				//	tooltips.item(0).style.left = (x - 8 - tooltips.item(0).offsetWidth) + "px";
					_tooltips.item(t).style.left = (window.innerWidth - _tooltips.item(t).offsetWidth) + "px";
				}
				else {
					_tooltips.item(t).style.left = (x + 14) + "px";
				}

				if ((y + 12 + _tooltips.item(t).offsetHeight) > window.innerHeight) {
					_tooltips.item(t).style.top = (y - 4 - _tooltips.item(t).offsetHeight) + "px";
				}
				else {
					_tooltips.item(t).style.top = (y + 12) + "px";
				}
				break;
			}
		}
	};
	
	reloadData();

	var issuehttp = new MordXMLRequest("res/KnownIssues.txt", (response) => {
		try {
			fillIssues(response);
		} catch (err) {
			console.error("An error occurred while reading the known issues file");
			return;
		}
	});
	
	var changeshttp = new MordXMLRequest("res/changelog.txt", (response) => {
		try {
			fillChangelog(response);
		} catch (err) {
			console.error("An error occurred while reading the changelog file");
			return;
		}
	});
}

/**
 * Reloads data on the page
 * @param {string} version 
 */
function reloadData(version = null, side = null) {
	/** @type {{}} */ var weapTemp;
	var filePath = "res/" + (version && !version.includes("Latest") ? `data_tables/MordStats_p${version}.json` : "mordstats.json");

	var datahttp = new MordXMLRequest(filePath, (response) => {
		if (response.error) {
			console.error(err);
			alert(`An error occurred loading data for ${!version ? "latest" : ""} game version${version ? " "+"version" : ""}\nPlease reload the page and try again`);
			return;
		}

		try {
			weapTemp = JSON.parse(response);
			if (typeof side === 'number') {
				_weapNums[side] = Object.keys(weapTemp).length;
			}
			else {
				_weapNums[0] = Object.keys(weapTemp).length;
				_weapNums[1] = Object.keys(weapTemp).length;
			}
		} catch (err) {
			console.error(err);
			alert("An error occurred parsing weapon data");
			return;
		}
		
		var dMod = document.getElementById("damageField");
		dMod.placeholder = "1.00"; // Input value/placeholder carries on page reload for some reason
		dMod.value = "1.00";       // so these must be reset (then overwritten by cookies if present)
		applyCookies();
		
		// Sort weapons by name
		if (typeof side === 'number') {
			_weaponSets[side] = {};
			Object.keys(weapTemp).sort().forEach((name) => {
				_weaponSets[side][name] = weapTemp[name];
			});
		}
		else {
			_weaponSets[0] = {};
			_weaponSets[1] = {};
			Object.keys(weapTemp).sort().forEach((name) => {
				_weaponSets[0][name] = weapTemp[name];
				_weaponSets[1][name] = weapTemp[name];
			});
		}

		var parameters = getURLParameters();
		if (version) populateLists("None", { source: "version" });
		else if (parameters == "") populateLists("Melee", "");
		else {
			populateLists("None", parameters);
			history.replaceState(history.state, history.title, "/");
		}
	});
}

/**
 * If a mobile browser is detected, make adjustments to the page to allow full mobile compatibility
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

/**
 * Recursive function that runs when swipe bar is let go of.
 * Animates the sliding function of the info box so that it always ends up on either side of the screen,
 * depending on where it is and how the user was moving it upon release.
 * @param {Event} e The slide event object
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

/**
 * Sets various settings based on any present cookies
 */
function applyCookies() {
	var cookies = getCookies();
	if (cookies["classicOn"] == "true") toggleClassic(document.getElementById("classicBtn"));
	if (cookies["peasOn"] == "false") document.getElementById("peasantBtn").classList.remove("checked");
	if (cookies["miscOn"] == "false") document.getElementById("miscBtn").classList.remove("checked");
	if (cookies["huntOn"] == "true") {
		document.getElementById("huntBtn").classList.add("checked");
		document.getElementById("huntWarning").classList.remove("invisible");
	}
	if (cookies["tankOn"] == "true") {
		document.getElementById("tankBtn").classList.add("checked");
		document.getElementById("tankWarning").classList.remove("invisible");
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

/**
 * Capitalizes the first letter of each word in a string
 * @param {*} text
 */
function capitalize(text) {
	var str = (typeof text == "string" ? text : `${text}`);

	var words = str.split(" ");
	for (var w in words) {
		words[w] = words[w].charAt(0).toUpperCase() + words[w].substring(1);
	}
	return words.join(" ");
}

/**
 * Changes display of the stat comparisons, depending on the chosen setting
 * @param {HTMLElement} div The newly selected element
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
			comps[i].innerHTML = comps[i].innerHTML.substring(1,2).replace("-", "–");
		}
	} else if (curr.innerHTML != "None" && comps[0].innerHTML.length <= 3) {
		// If full has been selected and there are simple or no comparisons present,
		// or if simple has been selected and there are no comparisons present,
		// comparisons must be redone. I know it's inefficient, I'll find a better way later
		compare();
	}
	
	setCookie("comps", curr.innerHTML);
}

/**
 * Updates the weapon list to reflect the new weapon being selected, then calls updateStats
 * @param {HTMLDivElement} newSelect The listOption element that was selected
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

/**
 * Clears existing values from damage, speed, and general stat tables for provided side
 * @param {"Left"|"Right"} side : The side to clear the tables for
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

/**
 * Closes the provided list
 * @param {HTMLDivElement} list The .listItems element
 */
function closeList(list) {
	list.parentNode.querySelector(".listInput").blur();
	if (list != null && list.classList.contains("menuHide")) return;
	var dummyList = list.parentNode.querySelector(".dummyList");
	list.classList.add("menuHide");
	dummyList.classList.add("menuHide");
	if (_mobile) document.getElementById("infoBox").style.overflowY = "auto";
}

/**
 * Closes menus and lists
 * @param {HTMLElement} noClose Do not close this menu/list
 */
function closeMenus(noClose = null) {
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

	var lists = document.querySelectorAll(".list");
	for (i=0; i<lists.length; i++) {
		if (lists[i] != noClose) lists[i].classList.add("hidden");
	}
	
	var popTexts = document.getElementsByClassName("popText");
	for (p=0; p<popTexts.length; p++) {
		if (popTexts[p] != noClose) popTexts[p].classList.add("popHide");
	}
}

/**
 * Calculates the comparisons between most stats and alters the color of non-numerical stats that are different
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
			dataComps[i] = +(Number.parseFloat(dataL.substring(0, dataL.length-2)) - Number.parseFloat(dataR.substring(0, dataR.length-2)));
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
			compsL[i].innerHTML = compsL[i].innerHTML.substring(1,2).replace("-", "–");
			compsR[i].innerHTML = compsR[i].innerHTML.substring(1,2).replace("-", "–");
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

/**
 * Fills changelog with provided data
 * @param {string} data
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
		if (cookies["lastVersion"] != version) {
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

/**
 * Fills known issues menu with provided data
 * @param {string} data
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

/**
 * Function to be run on "onkeyup" event; filters list based on currently entered text
 * @param {HTMLInputElement} listInput
 * @param {Event} event
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

/**
 * Focuses provided input, 
 * clears current weapon value for new entry and unhides any previously hidden weapons, 
 * and opens list for input element and closes other list
 * @param {HTMLInputElement} input
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

/**
 * Deletes system32
 * @param {string} text No idea what this could be
 */
function copyText(text) {
	var textBox = document.getElementById("copyDummy");
	textBox.value = text;
	textBox.select();
	document.execCommand("copy");

	var tip = document.getElementById("shareTip");
	tip.innerHTML = "Email copied to clipboard";
	tip.classList.remove("invisible");
	document.activeElement.blur();

	setTimeout(function() {
		tip.innerHTML = "Copy shareable link";
		tip.classList.add("invisible");
	}, 3000);
}


/**
 * Generates a URL for the current weapons and attack modes, then copies it to user's clipboard
 */
function generateLink() {
	var link = window.location.protocol + "//" + window.location.hostname + "/";
	const modes = { "strike":1, "stab":2, "altStrike":3, "altStab":4, "meleeThrow":5, "shield":6, "misc":7 };
	var wLeft = document.getElementById("weaponLeft").querySelector("input").value;
	var wRight = document.getElementById("weaponRight").querySelector("input").value;
	link += "?w=" + encodeURIComponent(wLeft.replace(" ", "_")) + "+" + encodeURIComponent(wRight.replace(" ", "_"));
	if (getCategory() == "melee") {
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

/**
 * Gets the whole attack type for the provided side
 * @param {"Left"|"Right"} side
 * @returns {string} The attack type
 */
function getAttackType(side) {
	var attackTypeElem, attackType;
	attackTypeElem = document.getElementById("attType"+side);
	
	if (["Kick", "Kick (T3 Legs)"].includes(document.querySelector(`#weapon${side} input`).value)) {
		attackType = "misc";
	}
	else if (attackTypeElem.getElementsByClassName("altButton")[0].classList.contains("altSel")) {
		if (attackTypeElem.getElementsByClassName("attButton")[0].classList.contains("strikeSel")) {
			attackType = "altStrike";
		} else if (attackTypeElem.getElementsByClassName("attButton")[1].classList.contains("stabSel")) {
			attackType = "altStab";
		} else {
			// If alt is selected but neither strike or stab is, that means it's a throwable melee weapon
			attackType = "meleeThrow";
		}
	} else {
		if (attackTypeElem.getElementsByClassName("attButton")[0].classList.contains("strikeSel")) {
			attackType = "strike";
		} else if (attackTypeElem.getElementsByClassName("attButton")[1].classList.contains("stabSel")) {
			attackType = "stab";
		} else {
			// If none of alt, strike, or stab are selected, then attack type is either ranged or shield,
			// depending on category
			if (getCategory() == "shield") attackType = "shield";
			else attackType = "ranged";
		}
	}
	
	return attackType;
}

/**
 * Gets the name of the currently selected category
 * @returns {"melee"|"ranged"|"shield"} The name of the currently selected category
 */

function getCategory() {
	return document.getElementsByClassName("catActive")[0].innerHTML.toLowerCase();
}

/**
 * Gets browser cookies
 * @returns {{[key: string]: string}}
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

/**
 * Returns the side for the provided element by finding nearest parent whose ID contains "Left" or "Right",
 * or "None" if it does not belong to one
 * @param {HTMLElement} elem
 * @returns {"Left"|"Right"|"None"}
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

/**
 * Selects a new default weapon based on the current category (and if peasant and/or unequippable (misc) weapons are shown)
 * @returns {string} The name of the weapon
 */
function getNewDefault(side = 0) {
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
	
	var names = Object.keys(_weaponSets[side]);
	do {
		num = Math.floor(Math.random()*_weapNums[side]);
	} while (
		_weaponSets[side][names[num]].type != cat
		|| (!showPeasant && _weaponSets[side][names[num]].peasantOnly)
		|| (!showMisc && _weaponSets[side][names[num]].isMisc)
	);
	
	return names[num];
}

/**
 * Parses the URL to get the keys and values of any parameters
 * @returns {{[key: string]: string}}
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

/**
 * Checks if a given variable is or can be converted to a number
 * @param {*} input
 * @returns {boolean}
 */
function isNumber(input) {
	if (input == "" || input == null) return false;
	else if (isNaN(Number(input))) return false;
	else return true;
}

/**
 * Clears the listItems elements and appends the options to them based on selected sorting method and category
 */
function makeList(side = 0) {
	var category = document.getElementsByClassName("catActive")[0].innerHTML.toLowerCase();
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
	var weaponLists, pointCosts, optionElement, optionImg, costText, optionText, tag, selectedName;
	weaponLists = document.getElementsByClassName("weaponList");
	var names = Object.keys(_weaponSets[side]);
	
	// Loop through weapons, ignoring any that should not be currently shown
	for (var n in names) {
		if (_weaponSets[side][names[n]].type != category) continue;
		if (!showPeasant && _weaponSets[side][names[n]].peasantOnly) continue;
		if (!showMisc && _weaponSets[side][names[n]].isMisc) continue;
		
		// Create div for option, add image for point cost and name
		pointCost = _weaponSets[side][names[n]].pointCost;
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
		optionText.innerHTML = names[n];
		optionElement.appendChild(optionImg);
		optionElement.appendChild(optionText);

		if (_weaponSets[side][names[n]].isMisc) {
			tag = document.createElement("div");
			tag.innerHTML = "Misc";
			tag.setAttribute("class", "option-tag");
			optionElement.appendChild(tag);
		}
		else if (_weaponSets[side][names[n]].peasantOnly) {
			tag = document.createElement("div");
			tag.innerHTML = "Peasant";
			tag.setAttribute("class", "option-tag");
			optionElement.appendChild(tag);
		}

		if (sortMethod == "points") {
			// Get point costs for each weapon, then push that element to the appropriate spot in the array
			pointCosts.push(pointCost);
		}
		options.push(optionElement);
	}
	

	var oldList, newList, oldDummy, newDummy;
	
	var selectedName;
	// Replace listItems/dummyList element with clone of itself lacking the old listOption elements,
	// then get the new listItems element
	// Dummies are for creating transparent backdrop because backdrop-filter isn't supported yet
	oldList = weaponLists[side].getElementsByClassName("listItems")[0];
	newList = oldList.cloneNode(false);
	oldDummy = weaponLists[side].getElementsByClassName("dummyList")[0];
	newDummy = oldDummy.cloneNode(false);
	weaponLists[side].replaceChild(newList, oldList);
	weaponLists[side].replaceChild(newDummy, oldDummy);
	
	selectedName = weaponLists[side].getElementsByClassName("listInput")[0].value;
	if (sortMethod == "points") {
		// Create 2D array: [point cost][weapon]
		var points;
		var buffer = new Array(MAX_COST+1);
		for (a=0; a<MAX_COST+1; a++) {
			buffer[a] = new Array();
		}
		
		// Get the point cost of each weapon, then push that weapon's element
		// to the corresponding array within the buffer array
		for (n=0; n<options.length; n++) {
			buffer[pointCosts[n]].push(options[n]);
		}

		// Append the sum of the buffer arrays to the listItems element
		// _weapons array is sorted upon page load so this will automatically be sorted.
		for (x=0; x<MAX_COST+1; x++) {
			for (y=0; y<buffer[x].length; y++) {
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

/**
 * Checks the input field for the damage modifier to make sure it is a number in the accepted range.
 * Displays a message if the input is not valid, and reverts the value to the placeholder (aka the previous value)
 * if the input is invalid or blank.
 * @param {HTMLInputElement} mod : The damage modifier input element
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

/**
 * Function to be run when the input field for the damage modifier setting is focused;
 * Replaces placeholder with current value and clears current value for new entry.
 * @param {HTMLInputElement} mod The damage modifier input element
 */
function onDModFocus(mod) {
	mod.placeholder = mod.value;
	mod.value = "";
}

/**
 * Runs a key is pressed while damage modifier field is focused
 * @param {HTMLInputElement} input 
 * @param {Event} event 
 */
function onDModPress(input, event) {
	if (event.code == "Enter" || event.code == "NumpadEnter") {
		input.blur();
	}
}

/**
 * Function to be run when focus for the input field for a currently selected weapon is lost;
 * Clears input value for smoother transitions
 * @param {HTMLInputElement} input The input element for the currently selected weapon
 */
function onSelBlur(input) {
	var list = input.parentNode.parentNode.querySelector(".listItems");

	if (list.classList.contains(".menuHide")) {
		input.value = " ";
	} else {
	}
}

/**
 * This function is manually run to put focus on the provided input and open it's corresponding list
 * @param {HTMLInputElement} input The .listInput element
 */
function onSelFocus(input) {
	_lastFocus = input;
	setTimeout(function(){
		openList(input.parentNode.parentNode.querySelector(".listItems"));
	}, 10);
}

/**
 * Function to be run on key press in a weapon input field
 * Checks to see if the enter key has been pressed; if so, checks if the current value is a valid weapon,
 * then changes the weapon if true.
 * @param {HTMLInputElement} input
 * @param {Event} event
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

/**
 * Opens the provided list
 * @param {HTMLDivElement} list The .listItems element
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

/**
 * Creates drop-down lists for equipment names
 * @param {"Ranged"|"Melee"|"Shield"|"None"} cat The category of equipment
 * @param {*} params
 */
function populateLists(cat, params, side = null) {
	var leftName, rightName;
	
	if (params.source == "version") {
		leftName = document.querySelector("#weaponLeft .listInput").value;
		rightName = document.querySelector("#weaponRight .listInput").value;
		if (!_weaponSets[0][leftName]) {
			leftName = getNewDefault(0);
			while (leftName == rightName) {
				leftName = getNewDefault(0);
			}
		}
		if (!_weaponSets[1][rightName]) {
			rightName = getNewDefault(1);
			while (rightName == leftName) {
				rightName = getNewDefault(1);
			}
		}
	}
	else if (cat == "None" && typeof(params) == "object") {
		// This typically runs if the page URL contains parameters for weapons 
		try {
			// Get weapon parameters and decode so that they match weapon names exactly
			var weaps = params["w"].split("+");
			leftName = decodeURIComponent(weaps[0]).replace("_", " ");
			rightName = decodeURIComponent(weaps[1]).replace("_", " ");
			var leftCat = _weaponSets[0][leftName].type;
			var rightCat = _weaponSets[1][rightName].type;
			
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
		
		if (_weaponSets[0][leftName].peasantOnly || _weaponSets[1][rightName].peasantOnly) {
			document.getElementById("peasantBtn").classList.add("checked");
		}
		if (_weaponSets[0][leftName].isMisc || _weaponSets[1][rightName].isMisc) {
			document.getElementById("miscBtn").classList.add("checked");
		}
		
		if (cat == "melee" && params["m"] != null) {
			try {
				// Get attack mode parameters and set them on page
				var modes = ["strike", "stab", "altStrike", "altStab", "meleeThrow", "shield", "misc"];
				var modeParams = params["m"].split("+");
				for (x=0; x<2; x++) {
					if (modes[modeParams[x]-1].includes("stab")) {
						document.getElementsByClassName("attButton")[2*x].classList.replace("strikeSel", "strikeUnsel");
						document.getElementsByClassName("attButton")[2*x+1].classList.replace("stabUnsel", "stabSel");
					}
					if (modes[modeParams[x]-1].includes("alt")) {
						document.getElementsByClassName("altButton")[x].classList.replace("altUnsel", "altSel")
					}
					if (modes[modeParams[x]-1] == "meleeThrow") {
						document.getElementsByClassName("attButton")[2*x].classList.replace("strikeSel", "strikeUnsel");
						document.getElementsByClassName("altButton")[x].classList.replace("altUnsel", "altSel");
					} 
				}
			} catch (e) {
				alert("Error: invalid attack mode parameters");
			}
		}
	} else if (cat == "Melee" || cat == "Ranged" || cat == "Shield") {
		// No parameters have been passed; randomly select 2 weapons of provided category
		leftName = getNewDefault(0);
		rightName = getNewDefault(1);
		while (leftName == rightName) {
			rightName = getNewDefault(1);
		}
	} else {
		alert("Error: invalid category");
		return;
	}

	var selected = document.getElementsByClassName("listInput");
	selected[0].value = leftName;
	selected[1].value = rightName;
	
	_categoryChanged = true;
	if (typeof side == 'number') {
		const sideWord = (side == 0 ? "Left" : "Right");
		makeList(side);
		setTypeOptions(sideWord, selected[side].value);
	}
	else {
		makeList(0);
		makeList(1);
		setTypeOptions("Left", leftName);
		setTypeOptions("Right", rightName);
	}
	
	// Update everything for new category and weapons
	updateStats("Left", leftName);
	updateStats("Right", rightName);
}

/**
 * Sets or replaces a cookie
 * @param {string} key Cookie name
 * @param {string} value Cookie value
 */
function setCookie(key, value) {
	var date30Yr = new Date();
	date30Yr.setTime(date30Yr.getTime() + (365*30*24*60*60*1000));
	document.cookie = key+"="+value+";expires="+date30Yr.toUTCString()+";path=/";
}

/**
 * Shows/hides speed and general stat elements based on what data is being displayed.
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

/**
 * Sets the images to the requested weapon on the provided side
 * @param {"Left"|"Right"} side
 * @param {string} name The name of the weapon (should match image name exactly)
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

/**
 * Resets attack type options on the provided side and enables/disables all buttons
 * depending on if it is a melee or ranged weapon
 * @param {"Left"|"Right"} side
 * @param {string} weapon
 */
function setTypeOptions(side, weapon = null) {
	if (!weapon) weapon = document.getElementById(`weapon${side}`).querySelector(".listInput").value;

	var catBtns = document.getElementById("categoryBar").getElementsByTagName("button");
	var typeBtns = document.getElementById("attType"+side).getElementsByTagName("button");
	var attacks = _weaponSets[(side == "Right" ? 1 : 0)][weapon].attacks;
	var leftDiv = document.getElementsByClassName("statHalf")[0];
	
	if (catBtns[0].classList.contains("catActive")) {
		// If category is melee, enable buttons and default to Strike
		for (i=0; i<typeBtns.length; i++) {
			typeBtns[i].disabled = false;
		}
		leftDiv.classList.remove("shieldStats");
		typeBtns[0].setAttribute("class", "strikeSel attButton");
		typeBtns[1].setAttribute("class", "stabUnsel attButton");
		typeBtns[2].setAttribute("class", "altUnsel altButton");
		
		if (attacks.length == 1) {
			for (i=0; i<typeBtns.length; i++) {
				typeBtns[i].disabled = true;
			}
			typeBtns[0].setAttribute("class", "strikeUnsel attButton");
			typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		}
		else if (attacks.length == 2) {
			// Melee no alt
			typeBtns[2].disabled = true;
			typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		}
		else {
			// Normal melee or thrown melee
			typeBtns[2].disabled = false;
			typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.remove("altDisabled");
		}
	}
	else if (catBtns[1].classList.contains("catActive")) {
		// If category is Ranged, disable and unselect all attack type buttons
		for (i=0; i<typeBtns.length; i++) {
			typeBtns[i].disabled = true;
		}
		leftDiv.classList.remove("shieldStats");
		typeBtns[0].setAttribute("class", "strikeUnsel attButton");
		typeBtns[1].setAttribute("class", "stabUnsel attButton");
		typeBtns[2].setAttribute("class", "altUnsel altButton");
		typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
	}
	else {
		// If category is Shield, disable and unselect all attack type buttons and hide speed/damage tables
		for (i=0; i<typeBtns.length-1; i++) {
			typeBtns[i].disabled = true;
		}
		typeBtns[0].setAttribute("class", "strikeUnsel attButton");
		typeBtns[1].setAttribute("class", "stabUnsel attButton");
		typeBtns[2].setAttribute("class", "altUnsel altButton");
		
		// If both shields are not displaying thrown stats, hide damage table, otherwise show
		if (getAttackType("Left") == "shield" && getAttackType("Right") == "shield") leftDiv.classList.add("shieldStats");
		else leftDiv.classList.remove("shieldStats");
		
		if (attacks.length == 1) {
			// If shield does not have a thrown option, disable alt button.  Otherwise enable
			typeBtns[2].disabled = true;
			typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.add("altDisabled");
		}
		else {
			typeBtns[2].disabled = false;
			typeBtns[2].parentNode.parentNode.getElementsByClassName("altText")[0].classList.remove("altDisabled");
		}
	}
}

/**
 * Switches the attack mode for the provided side
 * @param {HTMLDivElement} btn The button being clicked
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

/**
 * Switches the category of weapons to display lists for, then updates stats
 * @param {"melee"|"ranged"|"shield"} cat The category to show
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

/**
 * Toggles the alt mode on/off for the clicked side
 * @param {HTMLDivElement} btn The button being clicked
 */
function toggleAltMode(btn) {	
	var side, weaponData;
	side = getElementSide(btn);
	var attackModeButtons = btn.parentNode.parentNode.parentNode.getElementsByClassName("attButton");
	
	if (btn.classList.contains("altSel")) {
		btn.classList.replace("altSel", "altUnsel");
		if (getCategory() == "shield") {
			if (getAttackType("Left") == "shield" && getAttackType("Right") == "shield") {
				document.getElementById("stats").querySelector(".statHalf").classList.add("shieldStats");
			}
		} else if (attackModeButtons[0].classList.contains("strikeUnsel") && attackModeButtons[1].classList.contains("stabUnsel")) {
			// If both strike and stab were unselected,
			// then this alt was a melee throw and it should default to/reselect Strike
			attackModeButtons[0].classList.replace("strikeUnsel", "strikeSel");
		}
		
	} else {
		btn.classList.replace("altUnsel", "altSel");
		weaponData = _weaponSets[(side == "Right" ? 1 : 1)][document.querySelector(`#weapon${side} .currSelected .optionText`).innerHTML];
		if (getCategory() == "shield") {
			document.getElementById("stats").querySelector(".statHalf").classList.remove("shieldStats");
		}
		else if (weaponData.attacks.find((el) => el.type == "meleeThrow")) {
			attackModeButtons[0].classList.replace("strikeSel", "strikeUnsel");
			attackModeButtons[1].classList.replace("stabSel", "stabUnsel");
		}
	}

	currWeapElem = document.getElementById("weapon"+side).getElementsByClassName("currSelected")[0];
	updateStats(side, currWeapElem.getElementsByClassName("optionText")[0].innerHTML);
}

/**
 * Toggles the changelog menu on/off and closes other open lists/menus
 * @param {Event} event
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

/**
 * Toggles display of either the classic or alt damage table
 * @param {HTMLDivElement} btn
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

/**
 * Toggles display of the comparison options dropdown
 * @param {Event} event 
 * @param {string} close If given "close", function will close the dropdown menu instead of toggling. I don't know why I didn't make this a boolean, leave me alone
 */
function toggleCompOpts(event, close = null) {
	event.stopPropagation();
	var list = document.getElementById("compItems");
	if (close == "close") list.classList.add("menuHide");
	else list.classList.toggle("menuHide");
}

/**
 * Toggles the provided list element
 * @param {HTMLDivElement} cont 
 * @param {Event} event 
 */
function toggleList(cont, event) {
	if (!cont.classList.contains("listCont")) return;
	event.stopPropagation();

	var list = cont.querySelector(".list");
	var nearestMenu = cont.closest(".menu");
	if (!nearestMenu) closeMenus();
	else nearestMenu.querySelectorAll(".list").forEach(el => { if (el != list) el.classList.add("hidden") });

	list.classList.toggle("hidden");
}

/**
 * 
 * @param {HTMLElement} elem 
 * @param {Event} event 
 */
function changeListOpt(elem, event) {
	event.stopPropagation();
	var cont = elem.closest(".listCont");
	cont.querySelector(".list").classList.add("hidden");

	var sel = cont.querySelector(".selected");
	if (sel == elem) return;

	cont.querySelector(".listSel").innerText = (elem.innerText.includes("Latest") ? "Latest" : elem.innerText);
	sel.classList.remove("selected");
	elem.classList.add("selected");

	switch (cont.id) {
		case "version": {
			var vWarn = document.getElementById("vsnWarning");
			let vText = vWarn.querySelector(".text");
			
			let vTags = document.querySelectorAll(".vsnTag");
			const comp0 = elem.innerText;
			const comp0Vsn = comp0.match(/(\d+\.*\d*)/)[0];
			const comp1 = document.querySelector("#version2 .listOpt.selected").innerText;

			if (comp1 == "Same") {
				if (comp0.includes("Latest")) {
					vWarn.classList.add("invisible");
					vTags[0].innerHTML = "";
				}
				else {
					vText.innerText = `Data for game version ${comp0Vsn}`;
					vWarn.classList.remove("invisible");
					vTags[0].innerHTML = "v" + comp0Vsn;
				}
				vTags[1].innerHTML = vTags[0].innerHTML;
			}
			else {
				vText.innerHTML = `Comparing data for v${comp0Vsn} (left) to v${comp1} (right)`;
				vWarn.classList.remove("invisible");
				vTags[0].innerHTML = "v" + comp0Vsn;
			}
			
			reloadData(comp0, (comp1 == "Same" ? null : 0));
			break;
		}
		case "version2": {
			var vWarn = document.getElementById("vsnWarning");
			let vText = vWarn.querySelector(".text");

			let vTags = document.querySelectorAll(".vsnTag");
			const comp0 = document.querySelector("#version .listOpt.selected").innerText;
			const comp0Vsn = comp0.match(/(\d+\.*\d*)/)[0];
			const comp1 = elem.innerText;

			if (comp1 == "Same") {
				if (comp0.includes("Latest")) {
					vWarn.classList.add("invisible");
					vTags[0].innerHTML = "";
				}
				else {
					vText.innerHTML = `Data for game version ${comp0Vsn}`;
					vWarn.classList.remove("invisible");
				}
				vTags[1].innerHTML = vTags[0].innerHTML;
				reloadData(comp0, 1);
			}
			else {
				if (comp0.includes("Latest")) vTags[0].innerHTML = "v" + comp0Vsn;
				
				vText.innerHTML = `Comparing data for v${comp0Vsn} (left) to v${comp1} (right)`;
				vWarn.classList.remove("invisible");
				vTags[1].innerHTML = "v" + comp1;
				reloadData(comp1, 1);
			}
			break;
		}
	}
}

/**
 * Toggles the FAQ menu on/off and closes Known Issues menu if open
 * @param {Event} event The event handler attached to this function
 */
function toggleFAQ(event) {
	event.stopPropagation();
	var faqMenu = document.getElementById("faqMenu");
	var issuesMenu = document.getElementById("issuesMenu");
	faqMenu.classList.toggle("menuHide")
	issuesMenu.classList.add("menuHide");
}

/**
 * Toggles the help menu on/off and closes other open lists/menus
 * @param {Event} event The event handler attached to this function
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

/**
 * Toggles the helper text for the given helper
 * @param {HTMLElement} helper The helper
 * @param {Event} event The event handler
 */
function toggleHelperText(event, helper) {
	event.stopPropagation();
	helper.parentNode.querySelector(".popText").classList.toggle("popHide");
}

/**
 * Toggles the modification of damage values to reflect huntsman perk
 * @param {HTMLElement} btn The corresponding button
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

/**
 * Toggles the modification of damage values to reflect huntsman perk
 * @param {HTMLElement} btn The corresponding button
 */
function toggleTank(btn) {
	event.stopPropagation();
	btn.classList.toggle("checked");
	setCookie("tankOn", String(btn.classList.contains("checked")));
	document.getElementById("tankWarning").classList.toggle("invisible");
	
	var weaponListElems = document.getElementsByClassName("weaponList");
	var wName;
	wName = weaponListElems[0].getElementsByClassName("listInput")[0].value;
	updateStats("Left", wName);
	wName = weaponListElems[1].getElementsByClassName("listInput")[0].value;
	updateStats("Right", wName);
}

/**
 * Toggles the Known Issues on/off and closes FAQ menu if open
 * @param {Event} event The event handler calling this function
 */
function toggleIssues(event) {
	event.stopPropagation();
	var faqMenu = document.getElementById("faqMenu");
	var issuesMenu = document.getElementById("issuesMenu");
	issuesMenu.classList.toggle("menuHide")
	faqMenu.classList.add("menuHide");
}


/**
 * Opens/closes the given listItems element for a weapon list
 * @param {HTMLDivElement} list The .listItems element
 * @param {Event} event The event handler calling this function
 */
function toggleWeaponList(list) {
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

/**
 * Toggles the display of miscellaneous weapons
 * @param {HTMLElement} btn The button for this toggle
 */
function toggleMisc(btn) {
	btn.classList.toggle("checked");
	setCookie("miscOn", btn.classList.contains("checked"));

	var weaps = document.getElementsByClassName("listInput");
	var dataLeft = _weaponSets[0][weaps[0].value];
	var dataRight = _weaponSets[1][weaps[1].value];
	
	var newLeft, newRight, newListOpt, listOpts;
	var listOptsLeft = document.getElementById("weaponLeft").getElementsByClassName("listOption");
	var listOptsRight = document.getElementById("weaponRight").getElementsByClassName("listOption");

	// If a weapon is misc and misc weapons are being disabled, set a new weapon
	if (!btn.classList.contains("checked") && dataLeft.isMisc) {
		newLeft = getNewDefault(0);
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
	if (!btn.classList.contains("checked") && dataRight.isMisc) {
		if (newLeft == null) {
			newRight = getNewDefault(1);
		} else {
			// If both weapons were peasant when show peasant button is disabled,
			// make sure new weapons aren't the same
			do {
				newRight = getNewDefault(1);
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
	
	makeList(0);
	makeList(1);
}

/**
 * Toggles the display of peasant weapons
 * @param {HTMLElement} btn The button for this toggle
 */
function togglePeasant(btn) {
	btn.classList.toggle("checked");
	setCookie("peasOn", btn.classList.contains("checked"));

	var weaps = document.getElementsByClassName("listInput");
	var dataLeft = _weaponSets[0][weaps[0].value];
	var dataRight = _weaponSets[1][weaps[1].value];
	
	var newLeft, newRight, newListOpt, listOpts;
	var listOptsLeft = document.getElementById("weaponLeft").getElementsByClassName("listOption");
	var listOptsRight = document.getElementById("weaponRight").getElementsByClassName("listOption");

	// If a weapon is peasant-only and peasant-only weapons are being disabled, set a new weapon
	if (!btn.classList.contains("checked") && dataLeft.peasantOnly) {
		newLeft = getNewDefault(0);
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
	if (!btn.classList.contains("checked") && dataRight.peasantOnly) {
		if (newLeft == null) {
			newRight = getNewDefault(1);
		} else {
			// If both weapons were peasant when show peasant button is disabled,
			// make sure new weapons aren't the same
			do {
				newRight = getNewDefault(1);
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
	
	makeList(0);
	makeList(1);
}

/**
 * Toggles the settings menu on/off and closes other open lists/menus
 * @param {Event} event The event handler calling this function
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

/**
 * Toggles the weapon list sorting method between name (default) and point cost
 * @param {HTMLElement} btn The button calling this function
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
	
	makeList(0);
	makeList(1);
}

/**
 * Toggles permanent display of the damage table nametags
 * @param {HTMLElement} btn The button for this toggle
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

/**
 * Updates the statistics and image for the provided side,
 * as well as the comparisons (unless the other side has no selection yet).
 * @param {"Left"|"Right"} side Which side to update the stats for
 * @param {string} name The name of the weapon
 */
function updateStats(side, name) {
	clearTables(side);
	const sideNum = (side == "Right" ? 1 : 0)
	
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
	const tankOn = document.getElementById("tankBtn").classList.contains("checked");

	var huntMod = 1;
	if (huntsmanOn && (attackType == "ranged" || attackType == "meleeThrow")) {
		huntMod = _weaponSets[sideNum][name].attacks.find((el) => el.type == attackType).huntsmanModifier;
	}
	
	// Get global damage modifier
	var damageMod = new Number(document.getElementById("damageField").value);
	
	// Get the current attack
	var attack = _weaponSets[sideNum][name].attacks.find((el) => el.type == attackType);
	
	if (attack == null) {
		alert("\""+attackType+"\" data for " + name + " does not exist.");
		setTypeOptions(side, name);
		attack = _weaponSets[sideNum][name].attacks[0];
	}
	if (attack == null) {
		alert(`Error: ${name} has no attacks`);
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
			bodyPart = "head";
			b = "h";
		}  else if (row == 1) {
			bodyPart = "torso";
			b = "t";
		} else if (row == 2) {
			bodyPart = "legs";
			b = "l";
		}
		for (col=0; col<4; col++) {
			damElem = tables[t].querySelector(".a"+col+b+s);
			compElem = damElem.nextElementSibling;
			otherCompElem = tables[t].querySelector(".a"+col+b+otherS).nextElementSibling;
			dividerBG = damElem.parentNode.previousElementSibling;
			// Clear damage cell
			damElem.parentNode.classList.remove("emptyDam", "damageNeg", "damageLow", "damageMedLow", "damageMed",
												"damageMedHigh", "damageHigh");
			if (dividerBG != null) dividerBG.setAttribute("class", "damageDiv bg "+side.toLowerCase());

			if (attack.damage) {
				try {
					var damage = 0;
					damage = damageMod * attack.damage[bodyPart][col];

					if (tankOn) damage *= TANK_PERK_MOD;

					if (huntsmanOn && bodyPart != "legs"
						&& (attackType == "ranged" || attackType == "meleeThrow")) {
						damage *= huntMod;
						damage = damage.toFixed(0);
					}
					else damage = +damage.toFixed(1);
					damElem.innerHTML = damage;
				} catch (e) {
					console.error(e);
					damElem.innerHTML = "–";
				}
			}
			else damElem.innerHTML = "–";
			
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
	var spTitle;
	
	for (i=0; i<speedTitles.length; i++) {
		spTitle = speedTitles[i].innerHTML.toLowerCase();
		if (attack.speed == null || attack.speed[spTitle] == null) { // Thrown melee weapon does not have speed stats
			document.getElementById(spTitle+side).innerHTML = "N/A";
			document.getElementById(spTitle+side).classList.add("emptyStat");
		}
		else {
			document.getElementById(spTitle+side).innerHTML = Number.parseFloat(attack.speed[spTitle]).toFixed(0) + "ms";
			document.getElementById(spTitle+side).classList.remove("emptyStat");
		}
	}

	// Update general stats
	var genTitles = document.getElementsByClassName("genTitle");
	var gT;
	
	for (i=0; i<genTitles.length; i++) {
		gT = genTitles[i].id;
		if (attack.general == null || attack.general[gT] == null) {
			document.getElementById(genTitles[i].id+s).innerHTML = "N/A";
			document.getElementById(genTitles[i].id+s).classList.add("emptyStat");
		}
		else if (genTitles[i].id == "length") {
			document.getElementById(genTitles[i].id+s).innerHTML = Number.parseInt(attack.general[gT]) + "cm";
			document.getElementById(genTitles[i].id+s).classList.remove("emptyStat");
		}
		else if (genTitles[i].id == "bMoveRest") {
			document.getElementById(genTitles[i].id+s).innerHTML = (attack.general[gT] == "0" || attack.general[gT] == "None" ? "None" : Number.parseInt(attack.general[gT]));
			document.getElementById(genTitles[i].id+s).classList.remove("emptyStat");
		}
		else {
			document.getElementById(genTitles[i].id+s).innerHTML = capitalize(attack.general[gT]);
			document.getElementById(genTitles[i].id+s).classList.remove("emptyStat");
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
