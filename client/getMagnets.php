<?php

$dir = "magnets";

$files = scandir($dir);

foreach($files as $img) {
	if ($img != "." and $img != "..") {
		$times[$img] = filemtime("$dir/$img");
	}
}

arsort($times);
$magnets = array_keys($times);

$html = "";
foreach($magnets as $img) {
	$html .= "<img class='magnet' src='$dir/$img' />\n";
}

echo $html;

?>
