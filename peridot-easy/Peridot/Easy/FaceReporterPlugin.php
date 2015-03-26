<?php
namespace Peridot\Easy;

use Evenement\EventEmitterInterface;
use Peridot\Reporter\ReporterFactory;
use Symfony\Component\Console\Input\InputInterface;

require_once(__DIR__. '/FaceReporter.php');

/**
 * This plugin registers the Easy\FaceReporter with Peridot
 * @package Peridot\Easy\FaceReporter
 */
class FaceReporterPlugin {
  /**
   * @var EventEmitterInterface
   */
  protected $emitter;

  /**
   * @param EventEmitterInterface $emitter
   */
  public function __construct(EventEmitterInterface $emitter) {
    $this->emitter = $emitter;
    $this->emitter->on('peridot.reporters', [$this, 'onPeridotReporters']);
  }

  /**
   * @param InputInterface $input
   * @param ReporterFactory $reporters
   */
  public function onPeridotReporters(InputInterface $input, ReporterFactory $reporters) {
    $reporters->register(
      'face',
      'comical face spec reporter on gulp-peridot-easy',
      'Peridot\Easy\FaceReporter'
    );
  }
}
