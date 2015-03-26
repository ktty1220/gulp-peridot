<?php
namespace Peridot\Easy;

use Evenement\EventEmitterInterface;
use Peridot\Console\Environment;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Output\OutputOption;

/**
 * Class CodeCoverage
 * @package Peridot\Easy
 */
class CodeCoverage {
  /**
   * @var EventEmitterInterface
   */
  private $emitter = null;

  /**
   * @var PHP_CodeCoverage
   */
  private $coverage = null;

  /**
   * @var PHP_CodeCoverage_Filter
   */
  private $filter = null;

  /**
   * @var is windows
   */
  private $windows = false;

  /**
   * @var Code coverage report directory
   */
  private $reportDir = [
    'HTML' => null,
    'XML' => null,
    'Clover' => null,
    'PHP' => null,
    'Crap4j' => null,
    'Text' => null
  ];

  /**
   * Constructor.
   *
   * @param EventEmitterInterface $emitter
   */
  public function __construct(EventEmitterInterface $emitter) {
    $this->emitter = $emitter;
    $this->windows = (strpos(PHP_OS, 'WIN') !== false);
  }

  /**
   * Register the reporters.
   *
   * @return $this
   */
  public function register() {
    $this->emitter->on('peridot.start', [ $this, 'onPeridotStart' ]);
    $this->emitter->on('peridot.execute', [ $this, 'onPeridotExecute' ]);
    $this->emitter->on('runner.start', [ $this, 'onRunnerStart' ]);
    $this->emitter->on('runner.end', [ $this, 'onRunnerEnd' ]);
    return $this;
  }

  /**
   * Handle the peridot.start event.
   *
   * @param Environment $env
   */
  public function onPeridotStart(Environment $env) {
    $def = $env->getDefinition();

    foreach ($this->reportDir as $type => $path) {
      $f = (in_array($type, [ 'HTML', 'XML' ])) ? 'directory' : 'file';
      $def->option(
        'coverage-'. strtolower($type), null,
        InputOption::VALUE_REQUIRED,
        "Code coverage({$type}) report {$f}"
      );
    }

    foreach ([ 'Black', 'White' ] as $bw) {
      $def->option(
        'coverage-'. strtolower($bw). 'list', substr($bw, 0, 1),
        InputOption::VALUE_REQUIRED | InputOption::VALUE_IS_ARRAY,
        "{$bw}list file/dir for Code coverage"
      );
    }

    $def->getArgument('path')->setDefault('specs');
  }

  /**
   * Handle the peridot.execute event.
   *
   * @param InputInterface $input
   * @param OutputInterface $output
   */
  public function onPeridotExecute(InputInterface $input, OutputInterface $output) {
    $cov = false;
    foreach ($this->reportDir as $type => $path) {
      $dir = $input->getOption('coverage-'. strtolower($type));
      if (! empty($dir)) {
        $cov = true;
        $this->reportDir[$type] = $dir;
      }
    }

    if (! $cov) { return; }

    if (! class_exists('PHP_CodeCoverage')) {
      throw new \RuntimeException('PHP_CodeCoverage is not installed');
    }

    $this->filter = new \PHP_CodeCoverage_Filter();
    $defaultBlacklists = [
      getenv('HOME'). (($this->windows) ? '\AppData\Roaming\Composer' : '/.composer'),
      getcwd(). '/vendor',
      $input->getArgument('path')
    ];
    foreach ($defaultBlacklists as $bl) {
      $this->filter->addDirectoryToBlacklist($bl);
    }

    foreach ([ 'Black', 'White' ] as $bw) {
      $addDir = "addDirectoryTo{$bw}list";
      $addFile = "addFileTo{$bw}list";
      foreach ($input->getOption('coverage-'. strtolower($bw). 'list') as $bwl) {
        if (is_dir($bwl)) {
          $this->filter->$addDir($bwl);
        } else if (file_exists($bwl)) {
          $this->filter->$addFile($bwl);
        }
      }
    }

    $this->coverage = new \PHP_CodeCoverage(null, $this->filter);
  }

  /**
   * Handle the runner.start event.
   */
  public function onRunnerStart() {
    if (! $this->coverage) { return; }
    $this->coverage->start('peridot');
  }

  /**
   * Handle the runner.start event.
   *
   * @param float $runTime
   */
  public function onRunnerEnd($runTime) {
    if (! $this->coverage) { return; }
    $this->coverage->stop();

    foreach ($this->reportDir as $type => $path) {
      if (empty($path)) { continue; }
      $class = '\PHP_CodeCoverage_Report_'. $type;
      $writer = new $class();
      $ret = $writer->process($this->coverage, $path);
      if ($type === 'Text') { echo $ret; }
    }
  }
}
