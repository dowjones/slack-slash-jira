var _       = require('lodash'),
    util    = require('util'),
    JiraApi = require('jira').JiraApi;

var ERRORS = {
  NO_ISSUE_SPECIFIED: 'Whoops, you didn\'t specify an issue number.',
  INVALID_ISSUE: 'Uh oh, *%s* doesn\'t seem to be a valid issue number.'
};

module.exports = slashJira;

function _getRegExpFromString(inputstring) {
  var flags = inputstring.replace(/.*\/([gimy]*)$/, '$1');
  var pattern = inputstring.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1');
  return new RegExp(pattern, flags);
}

function slashJira (token, options) {
  this.token = token;
  this.jiraOpts = options.jira;
  this.jira = new JiraApi(
    this.jiraOpts.protocol,
    this.jiraOpts.host,
    this.jiraOpts.port,
    this.jiraOpts.user,
    this.jiraOpts.password,
    this.jiraOpts.apiVersion,
    this.jiraOpts.verbose,
    this.jiraOpts.strictSSL
  );
  this.jiraIssueRegEx = _getRegExpFromString(options.jiraIssueRegEx);
  this.jiraIssueBaseUrl = options.jiraIssueBaseUrl;
}

slashJira.prototype.handle = function (req, cb) {
  var bodyText = req.body.text,
      issueMatch = bodyText ? bodyText.match(this.jiraIssueRegEx) : undefined,
      id;

  if (!bodyText) {
    return cb(ERRORS.NO_ISSUE_SPECIFIED);
  }

  if (!issueMatch) {
    return cb(util.format(ERRORS.INVALID_ISSUE, bodyText));
  }
  
  id = issueMatch[1] + '-' + issueMatch[3];
  this._getJiraIssue(id, cb);
};

slashJira.prototype._getJiraIssue = function (issueId, cb) {
  var self = this;
  this.jira.findIssue(issueId, function (err, jiraRes) {
    if (err) {
      return cb(err);
    }
    cb(null, self._createSlackMessage(jiraRes));
  });
};

slashJira.prototype._swapDisplayName = function (name) {
  var nameArr = name.split(', ');
  if (nameArr.length === 2) {
    return nameArr.reverse().join(' ');
  }
  return name;
};

slashJira.prototype._createSlackMessage = function (jiraRes) {
  var issueUrl = this.jiraIssueBaseUrl + jiraRes.key,
      msg = '';

  msg += util.format('<%s|*%s*: %s>\n', issueUrl, jiraRes.key, jiraRes.fields.summary);
  msg += util.format('*Type:* %s\n', jiraRes.fields.issuetype.name);
  msg += util.format('*Assigned to:* %s\n', this._swapDisplayName(jiraRes.fields.assignee.displayName));
  msg += util.format('*Status:* %s', jiraRes.fields.status.name);

  return msg;
};