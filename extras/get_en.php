<?php
    $link = mysql_connect('localhost', 'root', '');
    if (!$link) {
        die('Could not connect: ' . mysql_error());
    }

    $q = "SET NAMES 'utf8'";
    $r = mysql_query($q);

    mysql_select_db('resursenew', $link) or die('Could not select database.');

    $q = "SET NAMES 'utf8'";
    $r = mysql_query($q);
	
	$q = "Select * from en_kjv";
	$r = mysql_query($q);
	
	$size = mysql_num_rows($r);
	for ($i = 0; $i < $size; $i++) {
		$row = mysql_fetch_array($r, MYSQL_ASSOC);
		echo "query.executeSql('INSERT INTO en_kjv(carte, capitol, verset, text) VALUES(?, ?, ?, ?)' ,  [" . 
			"'" . $row['carte'] . "', " . $row['capitol'] . "," . $row['verset'] . "," . "'" . str_replace("'", "\'", str_replace('\"', '"', str_replace("\'", "'", $row['text']))) . "'" . "]);";
		echo "<br />";
	}
?>