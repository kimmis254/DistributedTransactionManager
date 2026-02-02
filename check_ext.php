<?php
echo "PDO Drivers: " . implode(', ', PDO::getAvailableDrivers()) . "\n";
if (extension_loaded('sqlite3')) echo "sqlite3 loaded\n";
if (extension_loaded('pdo_sqlite')) echo "pdo_sqlite loaded\n";
if (extension_loaded('dom')) echo "dom loaded\n";
if (extension_loaded('xml')) echo "xml loaded\n";
