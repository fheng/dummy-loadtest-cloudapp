var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var _ = require('lodash');
var $fh = require('fh-mbaas-api');

module.exports = function fhdbRoute() {
  var router = new express.Router();
  router.use(cors());
  router.use(bodyParser());

  router.get('/', listAll);
  router.post('/', createOne);
  router.delete('/', deleteAll);
  router.put('/', replaceOrCreateCollection);

  router.get('/:guid', getOneByGuid);
  router.delete('/:guid', deleteOneByGuid);

  return router;
};

function listAll(req, res) {
  fhdb(res, baseOptions("list"));
}

function createOne(req, res) {
  fhdb(res, _.assign(baseOptions("create"), {
    fields: {
      text: _.get(req, "body.text", "")
    }
  }));
}

function deleteAll(req, res) {
  fhdb(res, baseOptions("deleteall"));
}

function replaceOrCreateCollection(req, res) {
  if (_.isArray(req.body)) {
    $fh.db(baseOptions("deleteall"), function (err, data) {
      handleFhdbErr(res, err);
    });

    fhdb(res, _.assign(baseOptions("create"), {
      fields: req.body
    }));
  } else {
    res.status(400).json({"error": "No req body given"});
  }
}

function getOneByGuid(req, res) {
  fhdb(res, _.assign(baseOptions("read"), {
    guid: _.get(req, "params.guid", "")
  }));
}

function deleteOneByGuid(req, res) {
  fhdb(res, _.assign(baseOptions("delete"), {
    guid: _.get(req, "params.guid", "")
  }));
}

function fhdb(res, options) {
  $fh.db(options, function (err, data) {
    handleFhdbErr(res, err);
    res.status(200).json(data);
  });
}

function baseOptions(act) {
  return {
    type: "LoadTestCollection",
    act: act
  };
}

function handleFhdbErr(res, err) {
  if (err) {
    console.error("Error " + err);
    res.status(400).json({error: err});
  }
}
