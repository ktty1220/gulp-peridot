<?php
namespace Peridot\Test\Example;

class SampleModule {
  public function __construct($name) {
    $this->name = $name;
  }

  public function hello() {
    return 'hello '. $this->name;
  }

  public function bad() {
    throw new \Exception('this is bad');
  }
}
