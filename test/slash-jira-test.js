/* global describe, beforeEach, it */
var should = require('should');
var sinon = require('sinon');
var SlashJira = require('../lib/slash-jira');
// var cb = function (){};

describe('slack-slash-jira', function () {
  var token = '';
  var req = { body: { text: 'ABC-1234' } };
  var opts = {
    jira: {},
    jiraIssueRegEx: '/(^[a-z]+)(-?)(\\d+$)/i',
    jiraIssueBaseUrl: ''
  };
  var slashJira;

  beforeEach(function () {
    slashJira = new SlashJira(token, opts);
  });

  describe('handle', function () {
    it('returns correctly formatted slack message', function (done) {
      var getIssueSpy = sinon.spy(slashJira, '_getJiraIssue');
      var stub = sinon.stub(slashJira.jira, 'findIssue', function (issue, cb) {
        cb(null, {
          key: 'ABC-1234',
          fields: {
            summary: 'Summary',
            issuetype: { name: 'Task' },
            assignee: { displayName: 'Gruber, Adam' },
            status: { name: 'Resolved' }
          }
        });
      });
      var expectedMsg = '<ABC-1234|*ABC-1234*: Summary>\n*Type:* Task\n*Assigned to:* Adam Gruber\n*Status:* Resolved';
      slashJira.handle(req, function (err, msg) {
        getIssueSpy.calledOnce.should.equal(true);
        expectedMsg.should.equal(msg);
        getIssueSpy.restore();
        stub.restore();
        done();
      });
    });

    it('returns error if call to Jira fails', function (done) {
      var expectedErrMsg = 'Invalid issue number.';
      var getIssueSpy = sinon.spy(slashJira, '_getJiraIssue');
      var stub = sinon.stub(slashJira.jira, 'findIssue', function (issue, cb) {
        cb(expectedErrMsg);
      });
      slashJira.handle(req, function (err) {
        getIssueSpy.calledOnce.should.equal(true);
        should.exist(err);
        expectedErrMsg.should.equal(err);
        getIssueSpy.restore();
        stub.restore();
        done();
      });
    });

    it('returns an error if the issue number is missing', function (done) {
      var missingReq = {
        body: {}
      };
      slashJira.handle(missingReq, function (err) {
        should.exist(err);
        err.should.equal('Whoops, you didn\'t specify an issue number.');
        done();
      });
    });

    it('returns an error if the issue number is invalid', function (done) {
      var invalidReq = {
        body: { text: 'ABC' }
      };
      slashJira.handle(invalidReq, function (err) {
        should.exist(err);
        err.should.equal('Uh oh, *ABC* doesn\'t seem to be a valid issue number.');
        done();
      });
    });
  });

  describe('_swapDisplayName', function () {
    it('returns name if name array length is not 2', function (done) {
      var swappedName = slashJira._swapDisplayName('Adam');
      swappedName.should.equal('Adam');
      done();
    });
  });
});
