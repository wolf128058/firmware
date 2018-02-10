
/*
All required uci packages are stored variable uci.
The GUI code displayes and manipulated this variable.
*/
var uci = {};
var gid = 0;


function init()
{
	send("/cgi-bin/settings", { func : "get_settings" }, function(data) {
		uci = fromUCI(data);
		rebuild_general();
		adv_apply();
	});
}

function updateFrom(src)
{
	var obj = {};
	collect_inputs(src, obj);
	for (var name in obj)
	{
		var value = obj[name];
		var path = name.split('#');

		var pkg = path[0];
		var sec = path[1];
		var opt = path[2];

		uci[pkg].pchanged = true;
		uci[pkg][sec][opt] = value
	}
}

function getChangeModeAction(ifname)
{
	return function(e) {
		var src = (e.target || e.srcElement);
		var mode = (src.data || src.value);
		delNetSection(ifname);
		addNetSection(ifname, mode);
	};
}

function appendSetting(p, path, value, mode)
{
	var id = path.join('#');
	var b;
	var cfg = path[0]
	var name = path[path.length-1];
	switch (name)
	{
	case "latitude":
		b = append_input(p, "Breitengrad", id, value);
		b.lastChild.placeholder = "52.xxx";
		addInputCheck(b.lastChild, /^$|^[1-9]\d{0,2}\.\d{1,8}$/, "Ung\xfcltige Eingabe. Bitte nur maximal 8 Nachkommastellen, keine Kommas und f\xfchrende Nullen verwenden.");
		addHelpText(b, "Der Breitengrad (als Dezimalzahl) dieses Knotens auf der Freifunk-Karte.");
		break;
	case "longitude":
		b = append_input(p, "L\xe4ngengrad", id, value);
		b.lastChild.placeholder = "8.xxx";
		addInputCheck(b.lastChild, /^$|^[1-9]\d{0,2}\.\d{1,8}$/, "Ung\xfcltige Eingabe. Bitte nur maximal 8 Nachkommastellen, keine Kommas und f\xfchrende Nullen verwenden.");
		addHelpText(b, "Der L\xe4ngengrad (als Dezimalzahl) dieses Knotens auf der Freifunk-Karte.");
		break;
	case "name":
		b = append_input(p, "Knotenname", id, value);
		b.lastChild.placeholder = "MeinFreifunkRouter";
		addInputCheck(b.lastChild, /^$|^[\-\^'\w\.\:\[\]\(\)\/ &@\+\u0080-\u00FF]{0,32}$/, "Ung\xfcltige Eingabe.");
		addHelpText(b, "Der Name dieses Knotens auf der Freifunk-Karte.");
		break;
	case "contact":
		b = append_input(p, "Kontaktdaten", id, value);
		b.lastChild.placeholder = "kontakt@example.com";
		addInputCheck(b.lastChild, /^$|^[\-\^'\w\.\:\[\]\(\)\/ &@\+\u0080-\u00FF]{0,50}$/, "Ung\xfcltige Eingabe.");
		addHelpText(b, "Kontaktdaten f\xfcr die \xf6ffentliche Freifunk-Karte und Statusseite. Falls ihr euch von anderen Leuten kontaktieren lassen wollt (z.B. \"info@example.com\").");
		break;
	case "community_url":
		b = append_input(p, "Community-Webseite", id, value);
		b.lastChild.placeholder = "http://muster.de";
		addClass(b, "adv_hide");
		addInputCheck(b.lastChild, /^$|^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/, "Ung\xfcltige URL.");
		addHelpText(b, "Webseite der Community, zu der dieser Knoten geh\xf6rt.");
		break;
	case "enabled":
		if (cfg == "autoupdater") {
			b = append_radio(p, "Autoupdater", id, value, [["An", "1"], ["Aus", "0"]]);
			addHelpText(b, "Der Auto-Updater aktualisiert die Firmware automatisch auf die neuste Version. Dabei bleibt die Konfiguration, die \xfcber die Weboberfl\xe4che gemacht wurde, erhalten. Spezifische Anpassungen \xfcber SSH k\xf9nnten eventuell \xfcberschrieben werden!");
		}
        if (cfg == "simple-tc") {
            b = append_radio(p, "Bandbreitenkontrolle", id, value, [["An", "1"], ["Aus", "0"]]);
            addHelpText(b, "Bandbreitenkontrolle f\xfcr den Upload-/Download \xfcber das Freifunknetz \xfcber den eigenen Internetanschluss.");
        }
        if (cfg == "fastd") {
            b = append_radio(p, "Fastd VPN", id, value, [["An", "1"], ["Aus", "0"]]);
            addHelpText(b, "Eine VPN-Verbindung zum Server \xfcber deinen Internetanschluss (WAN-Anschluss im Freifunk Router) aufbauen (per FastD).");
            addClass(b, "adv_hide");
        }
        break;
    case "exittunnel":                                                                                                                                        
        b = append_radio(p, "Exit-Tunnel", id, value, [["Ausland", "foreign"], ["Deutschland", "domestic"], ["Egal", "either"]]);   
        addHelpText(b, "Welchen Gateway soll dieser Freifunk bevorzugen? [Diese Option wird demnächst weg-optimiert] Ausland: Gateways auserhalb von Deutschland bevorzugen. Deutschland: Gateways innerhalb deutschlands bevorzugen. Egal: Schnelle Gateways bevorzugen");          
        addClass(b, "adv_hide");                                                                                                 
        break; 
    case "ipv6_only":
        b = append_radio(p, "IP Protokoll VPN", id, value, [["Dual Stack", "both"], ["IPv6", "ipv6"], ["IPv4 (legacy)", "legacy"]]);
        addHelpText(b, "Welche Version des IP-Protokolls soll f\xfcr den Verbindungsaufbau zum Gateway verwendet werden? (Dual Stack (empfohlen): Alle verfügbaren, IPv6: Nur IPv6 verwenden, IPv4: Nur IPv4 verwenden!)");
        addClass(b, "adv_hide");
        break;
    case "publish_map":
        b = append_radio(p, "Zur Karte beitragen", id, value, [["Nichts", "none"], ["Wenig", "basic"], ["Mehr", "more"], ["Alles", "all"]]);
        addHelpText(b, "Mit wievielen Daten soll dieser Knoten zur Knotenkarte beitragen? (Wenig: Name/Version/Modell/Position/Kontakt, Mehr: +Uptime/+CPU-Auslastung, Alles: +Speicherauslastung/+IP-Adressen des Routers im Freifunk-Netz)");
        break;
    case "limit_egress":
        b = append_input(p, "Freifunk Upload", id, value);
        addInputCheck(b.lastChild, /^\d+$/, "Upload ist ung\xfcltig.");
        addHelpText(b, "Maximaler Upload in KBit/s f\xfcr die Bandbreitenkontrolle.");
        break;
    case "limit_ingress":
        b = append_input(p, "Freifunk Download", id, value);
        addInputCheck(b.lastChild, /^\d+$/, "Download ist ung\xfcltig.");
        addHelpText(b, "Maximaler Download in KBit/s f\xfcr die Bandbreitenkontrolle.");
        break;
    case "allow_access_from":
        b = append_check(p, "SSH/HTTPS Zugriff", id, split(value), [["WAN","wan"], ["LAN","lan"], ["Freifunk","freifunk"]]);
        addHelpText(b, "Zugang zur Konfiguration \xfcber verschiedene Anschl\xfcsse/Netzwerke erm\xf6glichen.")
        break;
    case "service_link":
        var ula_prefix = uci['network']['globals']['ula_prefix'];
        var addr_prefix = ula_prefix.replace(/:\/[0-9]+$/,""); //cut off ':/64'
        var regexp = new RegExp("^$|((?=.*"+addr_prefix+"|.*\.ff[a-z]{0,3})(?=^.{0,128}$))");

        b = append_input(p, "Service Link", id, value);
        b.lastChild.placeholder = "http://["+addr_prefix+":1]/index.html";
        addInputCheck(b.lastChild, regexp, "Ung\xfcltige Eingabe.");
        addHelpText(b, "Ein Verweis auf eine _interne_ Netzwerkresource. Z.B. \"http://["+addr_prefix+":1]/index.html\".");
        break;
    case "service_label":
        b = append_input(p, "Service Name", id, value);
        b.lastChild.placeholder = "MeineWebseite";
        addInputCheck(b.lastChild, /^$|^[\[\]\(\) \w&\/.:\u0080-\u00FF]{0,32}$/, "Ung\xfcltige Eingabe.");
        addHelpText(b, "Ein Name der angegebenen Netzwerkresource. Z.B. \"Meine Webseite\".");
        break;
    case "service_display_max":
        b = append_input(p, "Max.-Eintr\xe4ge", id, value);
        addInputCheck(b.lastChild, /^\d+$/, "Ung\xfcltige Zahl.");
        addHelpText(b, "Maximale Anzahl der auf der eigenen Statusseite angezeigten Eintr\xe4ge.");
        break;
    case "community":
        b = append_input(p, "Community", id, value);
        addClass(b, "adv_hide");
        addInputCheck(b.lastChild, /^[a-z0-9_\-]{3,30}$/, "Ung\xfcltiger Bezeichner.");
        addHelpText(b, "Der Bezeichner der Community, zu der dieser Knoten geh\xf6rt.");
        break;
    default:
        return;
    }

    b.id = id; //needed for updateFrom
    b.onchange = function() {
        updateFrom(b);
    };

    return b;
}

function rebuild_general()
{
    var gfs = $("general");
    var rfs = $("resource");
    var tfs = $("traffic");

    removeChilds(gfs);
    removeChilds(rfs);
    removeChilds(tfs);

    if ('freifunk' in uci) {
        var f = uci.freifunk;
        var i = firstSectionID(f, "settings");
        appendSetting(gfs, ['freifunk', i, "name"], f[i]["name"]);
        appendSetting(gfs, ['freifunk', i, "longitude"], f[i]["longitude"]);
        appendSetting(gfs, ['freifunk', i, "latitude"], f[i]["latitude"]);
        appendSetting(gfs, ['freifunk', i, "contact"], f[i]["contact"]);
        appendSetting(rfs, ['freifunk', i, "community_url"], f[i]["community_url"]);
        appendSetting(rfs, ['freifunk', i, "community"], f[i]["community"]);
        appendSetting(gfs, ['freifunk', i, "ipv6_only"], f[i]["ipv6_only"]);
        appendSetting(gfs, ['freifunk', i, "exittunnel"], f[i]["exittunnel"]);
        appendSetting(gfs, ['freifunk', i, "publish_map"], f[i]["publish_map"]);
        appendSetting(gfs, ['freifunk', i, "allow_access_from"], f[i]["allow_access_from"]);
        appendSetting(rfs, ['freifunk', i, "service_label"], f[i]["service_label"]);
        appendSetting(rfs, ['freifunk', i, "service_link"], f[i]["service_link"]);
        appendSetting(rfs, ['freifunk', i, "service_display_max"], f[i]["service_display_max"]);
	}

	if ('autoupdater' in uci) {
		var a = uci.autoupdater;
		var i = firstSectionID(a, "autoupdater");
		appendSetting(gfs, ['autoupdater', i, "enabled"], a[i]["enabled"]);
	}

	if ('simple-tc' in uci) {
		var t = uci['simple-tc'];
		var i = firstSectionID(t, "interface");
		appendSetting(tfs, ['simple-tc', i, "enabled"], t[i]["enabled"]);
		appendSetting(tfs, ['simple-tc', i, "limit_ingress"], t[i]["limit_ingress"]);
		appendSetting(tfs, ['simple-tc', i, "limit_egress"], t[i]["limit_egress"]);
	}

	if ('fastd' in uci) {
		var a = uci.fastd;
		var i = firstSectionID(a, "fastd");
		appendSetting(gfs, ['fastd', i, "enabled"], a[i]["enabled"]);
	}
}

function save_data()
{
	for (var name in uci)
	{
		var obj = uci[name];
		if (!obj.pchanged)
			continue;
		var data = toUCI(obj);
		send("/cgi-bin/misc", { func : "set_config_file", name : name, data : data },
			function(data) {
				$('msg').innerHTML = data;
				$('msg').focus();
				init();
			}
		);
	}
}
