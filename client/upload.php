<?php

$html = "<html><head><title>Upload Magnet</title></head><body>";

if ( isset($_FILES['magnet']) ) {
	$magnet = $_FILES['magnet'];
	$extensions = array("png", "jpg", "jpeg", "bmp", "gif");
	if ($magnet['tmp_name'] > '' && $magnet['size'] < 200000) {
		if (in_array(end(explode(".", strtolower($magnet['name']))), $extensions)) {
			$targetPath = "magnets/".$magnet['name'];
			if (move_uploaded_file($magnet['tmp_name'], $targetPath)) {
				$html .= "Magnet successfully uploaded.";
				$html .= "<script type='text/javascript'>window.opener.uploadMagnet(); self.close();</script>";
			} else $html .= "Failure uploading magnet.";
		} else $html .= "File extension not supported.";
	} else $html .= "File size is too large.";
} else {
	$html .= "<form enctype='multipart/form-data' action='upload.php' method='POST'>";
	$html .= "<input type='hidden' name='MAX_FILE_SIZE' value='200000' />";
	$html .= "Choose an image to upload: <input name='magnet' type='file' />";
	$html .= "<input type='submit' value='Upload Image' /><br /><br />";
	$html .= "Images can be of any type that can be displayed in a browser (PNG, JPEG, BMP).";
}

$html .= "</body></html>";
echo $html;

?>
