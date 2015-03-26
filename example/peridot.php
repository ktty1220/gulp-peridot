<?php

use Evenement\EventEmitterInterface;

/**
 * Demonstrate registering a runner via peridot config
 */
return function(EventEmitterInterface $emitter) {
  $emitter->on('peridot.configure', function ($configuration, $application) {
    if (preg_match('/utf-8/i', getenv('LANG')) === 1) {
      $configuration->inputEncoding = 'Shift_JIS';
      $configuration->outputEncoding = 'UTF-8';
    }
  });
};
