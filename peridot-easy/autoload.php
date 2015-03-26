<?php
namespace Peridot\Easy;

class AutoLoader {
  protected $dirs;

  public function register() {
    spl_autoload_register(array($this, 'autoLoad'));
  }

  public function registerDir($dir) {
    $this->dirs[] = $dir;
  }

  public function autoLoad($className) {
    foreach ($this->dirs as $dir) {
      $file = $dir . DIRECTORY_SEPARATOR. str_replace('\\', DIRECTORY_SEPARATOR, $className) . '.php';
      if (is_readable($file)) {
        require $file;
        return;
      }
    }
  }

  public function loadComposer() {
    $composerHome = getenv('HOME').
      ((strpos(PHP_OS, 'WIN') !== false) ? '\AppData\Roaming\Composer' : '/.composer');
    $autoloadPhp = '/vendor/autoload.php';
    $composer = getcwd(). $autoloadPhp;
    if (! file_exists($composer)) {
      $composer = $composerHome. $autoloadPhp;
    }
    if (file_exists($composer)) {
      require_once($composer);
    }
  }
}

function main() {
  $al = new AutoLoader();
  $al->loadComposer();
  $al->registerDir(__DIR__);
  $al->register();
}

main();
require(__DIR__. '/assert.php');
