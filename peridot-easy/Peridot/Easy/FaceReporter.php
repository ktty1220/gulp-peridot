<?php
namespace Peridot\Easy;

use Peridot\Core\Test;
use Peridot\Core\Suite;
use Peridot\Runner\Context;
use Peridot\Core\TestInterface;

class FaceReporter extends \Peridot\Reporter\SpecReporter {
  /**
   * Initialize reporter. Setup and listen for runner events
   *
   * @return void
   */
  public function init() {
    $this->symbols['check'] = '( ^-^)b';
    $this->symbols['warning'] = '(/-_-)/';
    $this->symbols['error'] = "(>'A`)>";
    $this->colors['file'] = ['left' => "\033[33m", 'right' => "\033[39m"];
    parent::init();
  }

  /**
   * Convert output encoding
   *
   * @return void
   */
  protected function convertEncoding($str) {
    $config = $this->configuration;
    if (! isset($config->inputEncoding) && ! isset($config->outputEncoding)) {
      return $str;
    }
    $iEnc = ($config->inputEncoding) ?: 'auto';
    $oEnc = ($config->outputEncoding) ?:  mb_internal_encoding();
    return mb_convert_encoding($str, $oEnc, $iEnc);
  }

  /**
   * Output a test failure.
   *
   * @param int $errorIndex
   * @param Test $test
   * @param $exception - an exception like interface with ->getMessage(), ->getTraceAsString()
   */
  protected function outputError($errorNumber, TestInterface $test, $exception) {
    $this->output->writeln(sprintf(
      "  %d)%s:",
      $errorNumber,
      $this->convertEncoding($test->getTitle())
    ));

    $message = sprintf(
      "     %s",
      str_replace(PHP_EOL, PHP_EOL. "     ", $this->convertEncoding($exception->getMessage()))
    );
    $this->output->writeln($this->color('error', $message));
    $this->output->writeln('');
  }

  /**
   * @param Test $test
   */
  public function onTestPassed(Test $test) {
    $this->output->writeln(sprintf(
      "  %s%s %s",
      $this->indent(),
      $this->color('success', $this->symbol('check')),
      $this->color('muted', $this->convertEncoding($test->getDescription()))
    ));
  }


  /**
   * @param Test $test
   */
  public function onTestFailed(Test $test) {
    $this->output->writeln(sprintf(
      "  %s%s",
      $this->indent(),
      $this->color('error', sprintf(
        "%s %d) %s",
        $this->symbols['error'],
        count($this->errors),
        $this->convertEncoding($test->getDescription())
      ))
    ));
  }

  /**
   * @param Test $test
   */
  public function onTestPending(Test $test) {
    $this->output->writeln(sprintf(
      $this->color('pending', "  %s%s %s"),
      $this->indent(),
      $this->symbols['warning'],
      $this->convertEncoding($test->getDescription())
    ));
  }

  /**
   * @param Suite $suite
   */
  public function onSuiteStart(Suite $suite) {
    if ($suite != $this->root) {
      ++$this->column;
      $file = '';
      if ($suite->getParent() === $this->root) {
        $file = $this->color('file', ' ['. basename($suite->getFile()). ']');
      }
      $this->output->writeln(sprintf(
        '%s%s%s',
        $this->indent(),
        $this->convertEncoding($suite->getDescription()),
        $this->convertEncoding($file)
      ));
    }
  }
}
