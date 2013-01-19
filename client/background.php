<?php

$html = "<html><head><title>Load Background</title></head><body>";

if ( isset($_FILES['background']) ) {
	$background = $_FILES['background'];
	$extensions = array("png", "jpg", "jpeg", "bmp", "gif");
	if ($background['tmp_name'] > '' && $background['size'] < 2000000) {
		$ext = end(explode(".", strtolower($background['name'])));
		if (in_array($ext, $extensions)) {
			$targetPath = "backgrounds/".$background['name'];
			if (move_uploaded_file($background['tmp_name'], $targetPath)) {
				$html .= "Background successfully loaded.";
				$html .= "<script type='text/javascript'>window.opener.loadBackground(null,$targetPath); self.close();</script>";
			} else $html .= "Failure uploading background.";
		} else $html .= "File extension not supported.";
	} else $html .= "File size is too large: ".$background['size'];
} else {
	$html .= "<form enctype='multipart/form-data' action='background.php' method='POST'>";
	$html .= "<input type='hidden' name='MAX_FILE_SIZE' value='2000000' />";
	$html .= "Choose an image to upload: <input name='background' type='file' />";
	$html .= "<input type='submit' value='Load Image' /><br /><br />";
	$html .= "Images can be of any type that can be displayed in a browser (PNG, JPEG, BMP).";
}

$html .= "</body></html>";
echo $html;

?>
