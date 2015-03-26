<?php
require_once(__DIR__. '/../src/sample-module.php');

use Peridot\Test\Example\SampleModule;

describe('Sample Module', function() {
  beforeEach(function() {
    $this->module = new SampleModule('foo');
  });

  afterEach(function() {
    unset($this->module);
  });

  context('when using a context', function() {
    describe('hello()', function() {
      it('should return "hello <name>"', function() {
        assert($this->module->hello() === 'hello foo');
      });
    });

    xdescribe('this test is pending', function() {
      it('bye() <not implement>', function() {
        assert($this->module->bye() === 'bye foo');
      });
    });
  });

  describe('this test will fail', function() {
    it('this will not pass!! OMG', function() {
      $this->module->bad();
    });
  });
});
