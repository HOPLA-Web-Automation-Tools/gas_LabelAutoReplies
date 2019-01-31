/**
 * @OnlyCurrentDoc
 */

var scriptName = "Label Auto-Replies";
var userProperties = PropertiesService.getUserProperties();
var OOFThreads = [];
var labelName = userProperties.getProperty("labelName") || "Auto Replies";
var maxTime = userProperties.getProperty("maxTime") || 10;
var checkFrequency_MINUTE = userProperties.getProperty("checkFrequency_MINUTE") || 5;
var useCustomFilters = userProperties.getProperty("useCustomFilters") || "false";
var filters = userProperties.getProperty("filters") || "";
var isRegex = userProperties.getProperty("isRegex") || "false";
var isCaseSensitive = userProperties.getProperty("isCaseSensitive") || "false";
var script_status = userProperties.getProperty("status") || "disabled";


var user_email = Session.getEffectiveUser().getEmail();

function test() {
  Logger.log(userProperties.getProperty("status"));
  // var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL)
  // return HtmlService.createHtmlOutput(authInfo.getAuthorizationStatus());
}
global.doGet = doGet;
function doGet(e) {
  if (e.parameter.setup) { // SETUP
    deleteAllTriggers();

    //    ScriptApp.newTrigger("label_autoreplies").timeBased().everyMinutes(checkFrequency_MINUTE).create();

    var content = "<p>" + scriptName + " has been installed on your email " + user_email + ". "
    + "It is currently set to label auto-reply emails every " + checkFrequency_MINUTE + " minutes.</p>"
    + '<p>You can change these settings by clicking the HOPLA Tools extension icon or HOPLA Tools Settings on gmail.</p>';

    return HtmlService.createHtmlOutput(content);
  } else if (e.parameter.test) {
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    return HtmlService.createHtmlOutput(authInfo.getAuthorizationStatus());
  } else if (e.parameter.autoreplies_saveVariables) { // SET VARIABLES
    userProperties.setProperty("labelName", e.parameter.labelName || labelName);
    userProperties.setProperty("maxTime", e.parameter.maxTime || maxTime);
    userProperties.setProperty("checkFrequency_MINUTE", (e.parameter.checkFrequency_MINUTE) || checkFrequency_MINUTE);
    userProperties.setProperty("filters", e.parameter.filters || "");
    userProperties.setProperty("useCustomFilters", e.parameter.useCustomFilters);
    userProperties.setProperty("isRegex", e.parameter.regex);
    userProperties.setProperty("isCaseSensitive", e.parameter.isCaseSensitive);
    userProperties.setProperty("status", e.parameter.status || script_status);

    useCustomFilters = userProperties.getProperty("useCustomFilters") || "false";
    filters = userProperties.getProperty("filters") || "";
    isRegex = userProperties.getProperty("isRegex") || "false";
    isCaseSensitive = userProperties.getProperty("isCaseSensitive") || "false";

    if (filters === "") {
      useCustomFilters = false;
    }


    labelName = userProperties.getProperty("labelName");
    maxTime = userProperties.getProperty("maxTime");
    checkFrequency_MINUTE = userProperties.getProperty("checkFrequency_MINUTE");

    deleteAllTriggers();
    if (e.parameter.status === 'enabled') {
      ScriptApp.newTrigger("label_autoreplies").timeBased().everyMinutes(checkFrequency_MINUTE).create();
    }
    return ContentService.createTextOutput("settings has been saved.");
  } else if (e.parameter.autoreplies_trigger) { // DO IT NOW
    var res = label_autoreplies();
    if (res > 0) {
      return ContentService.createTextOutput("Successfully labeled " + res + " thread(s).");
    } else {
      return ContentService.createTextOutput("label auto-replies has finished but no auto-reply was found.");
    }
  } else if (e.parameter.autoreplies_disable) { // DISABLE
    userProperties.setProperty("status", "disabled");
    deleteAllTriggers();
    return ContentService.createTextOutput("Triggers has been disabled.");
  } else if (e.parameter.autoreplies_enable) { // ENABLE
    userProperties.setProperty("status", "enabled");
    deleteAllTriggers();
    ScriptApp.newTrigger("label_autoreplies").timeBased().everyMinutes(checkFrequency_MINUTE).create();
    return ContentService.createTextOutput("Triggers has been enabled.");
  } else if (e.parameter.autoreplies_getVariables) { // GET VARIABLES
    var status;
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    if (authInfo.getAuthorizationStatus() === ScriptApp.AuthorizationStatus.REQUIRED) {
      status = 're-authorize';
    } else {
      var triggers = ScriptApp.getProjectTriggers();
      if (triggers.length !== 1) {
        status = "disabled";
      } else {
        status = "enabled";
      }
    }

    Logger.log("GET: " + userProperties.getProperty("useCustomFilters"));
    var resjson = {
      'labelName': userProperties.getProperty("labelName") || 'Auto Replies',
      'maxTime': userProperties.getProperty("maxTime") || 10,
      'checkFrequency_MINUTE': userProperties.getProperty("checkFrequency_MINUTE") || 10,
      'useCustomFilters': userProperties.getProperty("useCustomFilters") || false,
      'filters': userProperties.getProperty("filters") || "",
      'isRegex': userProperties.getProperty("isRegex") || false,
      'isCaseSensitive': userProperties.getProperty("isCaseSensitive") || false,
      'status': status
    };
    return ContentService.createTextOutput(JSON.stringify(resjson));
  } else { // NO PARAMETERS
    // use an externally hosted stylesheet
    var style = '<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">';

    // get the query "greeting" parameter and set the default to "Hello"
    var greeting = scriptName;
    // get the query "name" parameter and set the default to "World!"
    var name = "has been installed";

    // create and use a template
    var heading = HtmlService.createTemplate('<h1><?= greeting ?> <?= name ?>!</h1>');

    // set the template variables
    heading.greeting = greeting;
    heading.name = name;

    deleteAllTriggers();

    var content = "<p>" + scriptName + " has been installed on your email " + user_email + ". "
    + "It is currently set to label auto-reply emails every " + checkFrequency_MINUTE + " minutes.</p>"
    + '<p>You can change these settings by clicking the HOPLA Tools extension icon or HOPLA Tools Settings on gmail.</p>';

    ScriptApp.newTrigger("label_autoreplies").timeBased().everyMinutes(checkFrequency_MINUTE).create();

    var HTMLOutput = HtmlService.createHtmlOutput();
    HTMLOutput.append(style);
    HTMLOutput.append(heading.evaluate().getContent());
    HTMLOutput.append(content);

    return HTMLOutput;
  }
}

function deleteAllTriggers() {
  // DELETE ALL TRIGGERS
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  // DELETE ALL TRIGGERS***
}
function label_autoreplies() {
  Logger.log("label_autoreplies started for " + user_email);
  var d = new Date();
  Logger.log("maxTime=" + maxTime);
  Logger.log("NOW=" + d.getTime() / 1000);
  var n = ((d.getTime() / 1000) - (maxTime * 60));
  n = n.toFixed();
  Logger.log("n = " + n);
  var filters = [
    'in:inbox',
    'after:' + n
  ];

  try {
    var threads = GmailApp.search(filters.join(' '), 0, 100),
      threadMessages = GmailApp.getMessagesForThreads(threads);


    if (threads.length === 100) {
      ScriptApp.newTrigger("label_autoreplies")
        .timeBased()
        .at(new Date((new Date()).getTime() + 1000 * 60 * 10))
        .create();
    }

    if (useCustomFilters === 1) {
      filters = userProperties.getProperty("filters") || "";
      var filts = filters.split('%2C');
      Logger.log("Using custom filters: " + filters);
      Logger.log("Splitted: " + filts.toString());
    } else {
      Logger.log("Using default filters");
    }

    var count_pass = 0,
      count_fail = 0;
    for (var i = 0; i < threadMessages.length; i++) {
      var lastMessage = threadMessages[i][threadMessages[i].length - 1],
        lastFrom = lastMessage.getFrom(),
        body = lastMessage.getRawContent(),
        subject = lastMessage.getSubject(),
        thread = lastMessage.getThread();

      if (regex_rawBody(body) || regex_subject(subject)) {
        count_pass += 1;
        OOFThreads.push(thread);
      } else {
        count_fail += 1;
      }
    }
  } catch (e) {
    Logger.log("Error = " + e);
  }

  Logger.log("Auto-replies=" + count_pass + " Not-Auto-replies:" + count_fail);

  // Mark unresponded in bulk.
  Logger.log("Labeling threads started.");
  try {
    markLabel(OOFThreads);
  } catch (e) {
    Logger.log("error = %s", e);
  }
  Logger.log("Archiving threads started.");
  try {
    archive(OOFThreads);
  } catch (e) {
    Logger.log("error = %s", e);
  }

  Logger.log("Labeling and archiving done..");
  Logger.log('Labeled ' + OOFThreads.length + ' threads as autoreplies.');
  return OOFThreads.length;
}

useCustomFilters = userProperties.getProperty("useCustomFilters") || 0;
filters = userProperties.getProperty("filters") || "";
isRegex = userProperties.getProperty("isRegex") || 0;

function regex_rawBody(pBody) {
  if (useCustomFilters === 1) {
    var filts = filters.split('%2C');


    for (var i = 0; i < filts.length; i++) {
      if (isRegex) {
        var re = new RegExp(filts[i], "mi");
      } else {
        re = filts[i];
      }
      if (pBody.match(re)) return 1;
    }
  } else { // DEFAULT
    var regexes = [/Auto-Submitted: (?:auto-generated|auto-replied)/i, /X-Autorespond:/i, /X-Autoreply:/i, /precedence:/i, /x-precedence: (?:auto_reply|bulk|junk)/i,
      /X-AutoReply-From:/i, /X-Mail-Autoreply/i, /X-FC-MachineGenerated: true/i, /X-POST-MessageClass: 9; Autoresponder/i, /Delivered-To: Autoresponder/i,
      /X-Uv-Mailing: auto_response/i, /Auto-Submitted: auto-replied/i, /Danke für ihre Anfrage/i
    ];

    for (var i = 0; i < regexes.length; i++) {
      if (pBody.match(regexes[i])) return 1;
    }

    var strings = ["Received Your Email", "Thank you for", "out of office", "out of the office", "Automatic reply", "automated response", "has been received", "could not be delivered", "confirm subscription"];
    for (var i = 0; i < strings.length; i++) {
      if (pBody.toLowerCase().indexOf(strings[i].toLowerCase()) !== -1) return 1;
    }
  }


  return 0;
}

function regex_subject(pSubj) {
  var regexes = [/^Automatische Beantwortung/mi, /^Auto:/mi, /^Automatic reply/mi, /^Autosvar/mi, /^Automatisk svar/mi, /^Automatisch antwoord/mi, /^Auto Response/mi, /^Out of Office/mi];
  for (var i = 0; i < regexes.length; i++) {
    if (pSubj.match(regexes[i])) return 1;
  }
  return 0;
}

function markLabel(threads) {
  var label = getLabel(labelName);
  var ADD_LABEL_TO_THREAD_LIMIT = 100;
  // addToThreads has a limit of 100 threads. Use batching.
  if (threads.length > ADD_LABEL_TO_THREAD_LIMIT) {
    for (var i = 0; i < Math.ceil(threads.length / ADD_LABEL_TO_THREAD_LIMIT); i++) {
      label.addToThreads(threads.slice(100 * i, 100 * (i + 1)));
    }
  } else {
    label.addToThreads(threads);
  }
}

function archive(threads) {
  for (var i = 0; i < threads.length; i++) {
    threads[i].moveToArchive();
  }
}

function threadHasLabel(thread, labelName) {
  var labels = thread.getLabels();

  for (var i = 0; i < labels.length; i++) {
    var label = labels[i];

    if (label.getName() === labelName) {
      return true;
    }
  }

  return false;
}

function isMe(fromAddress) {
  var addresses = getEmailAddresses();
  for (var i = 0; i < addresses.length; i++) {
    var address = addresses[i];
    var r = RegExp(address, 'i');

    if (r.test(fromAddress)) {
      return true;
    }
  }
  return false;
}

function getEmailAddresses() {
  // Cache email addresses to cut down on API calls.
  if (!this.emails) {
    var me = Session.getActiveUser().getEmail(),
      emails = GmailApp.getAliases();

    emails.push(me);
    this.emails = emails;
  }
  return this.emails;
}

function getLabel(labelName) {
  // Cache the labels.
  this.labels = this.labels || {};
  label = this.labels[labelName];

  if (!label) {
    // Logger.log('Could not find cached label "' + labelName + '". Fetching.', this.labels);

    var label = GmailApp.getUserLabelByName(labelName);

    if (label) {
      // Logger.log('Label exists.');
    } else {
      // Logger.log('Label does not exist. Creating it.');
      label = GmailApp.createLabel(labelName);
    }
    this.labels[labelName] = label;
  }
  return label;
}