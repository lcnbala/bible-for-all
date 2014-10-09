var books = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonian','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
var chapters = [50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
var current_version = '3.4';

function add_remove(version, action) {
	if (action == 0) {
		var viewTabUrl = chrome.extension.getURL('bible.html');
		var views = chrome.extension.getViews();

		for (var i = 0; i < views.length; i++) {
			var view = views[i];
			if (view.location.href == viewTabUrl) {
				view._database.transaction(function(query) { query.executeSql("DROP TABLE " + version) }); 
				document.getElementById(version).innerHTML = 'not installed'
				break;
			}
		}
	}	
}		

function add_books() {
	for (var i = 0; i < books.length; i++)
		$('#bible_books').append($('<tr><td id="book_' + i + '">' + books[i] + "</td></tr>"));
}

function add_chapters() {
	for (var i = 1; i <= 50; i++)
		$('#bible_chapters').append($('<tr><td id="chapter_' + i + '">' + i + "</td></tr>"));
}

function getBibleView() {
	var viewTabUrl = chrome.extension.getURL('bible.html');
	var views = chrome.extension.getViews();

	for (var i = 0; i < views.length; i++) {
		var view = views[i];
		if (view.location.href == viewTabUrl) 
			return view;			
	}
}

function afterInitialization() {
    add_books();
    add_chapters();

    localStorage['version'] = current_version;
    localStorage['bible_version'] = 'en_kjv';

    loadBibleChapter('Genesis', 1);
    $('#book_0').addClass('selected');
    $('#chapter_1').addClass('selected');

    $('#loading').hide();
    $('#table_main').show();

    
    $('#div_books').slimScroll({
        height: $(window).height() - $('#tabel_header').height() - 12
    });

    $('#div_chapters').slimScroll({
        height: $(window).height() - $('#tabel_header').height() - 12
    });
}
function onSuccess(tx, r) {

    afterInitialization();
}

function initialize() {
	var view = getBibleView();		
	view._database = window.openDatabase('bible_for_all_3', "", 'bible_for_all_3', 9999999999) 					
	if (current_version != localStorage['version']) {
		view._database.transaction(function(query) { 
			query.executeSql('DROP table en_kjv', []); 
		}); 	
		view._database.transaction(function(query) { 
			query.executeSql('DROP table en_nasb', []);
		}); 	

		get_en_nasb();
		get_en_kjv();

	} else {
        afterInitialization();
    }
}

function loadBibleChapter(book, chapter) {
	var view = getBibleView();
	if (book != undefined && chapter != undefined) {
		if (view._database) {
			view._database.transaction(function(query) { 				
				query.executeSql("SELECT * FROM " + localStorage['bible_version'] + " WHERE carte = ? AND capitol = ?", [book, parseInt(chapter)], 			
					function(transaction, result) { 
						var total = result.rows.length;
                        $('#content').html('<tr><td><h2>' + book + ' ' + chapter + '</h2>');
                        var verse = '';
						for (var i = 0; i < total; i++) {			
							verse += '<span class="verse"><b>' + ' ' + (i + 1) + '</b> ' + result.rows.item(i).text + '<br />' + '</span>';
						}   
                        $('#content').append(verse + '</td></tr>');
                        $('#bible_content').slimScroll({
                            height: $(window).height() - $('#tabel_header').height() - 12
                        });
					}			
				)
			}); 
		}
	}
}

$(document).ready(function() {

    initialize();

    $(document).on('mouseover', "[id^='book']", function (event) {
        $(this).css('cursor', 'pointer');
    });

    $(document).on('mouseover', "[id^='chapter']", function (event) {
        $(this).css('cursor', 'pointer');
    });

    $(document).on('click', "[id^='book']", function (event) {
        $('#bible_books .selected').removeClass('selected');
        $(this).css('cursor', 'pointer');
        var bookId = $(this).attr("id").replace('book_', '');
        $("#book_" + bookId).addClass('selected');

        var bookIndex = $(this).attr("id").replace('book_', '');
        var chaptersTotal = chapters[bookIndex];

        var opt = '';
        for (var i = 0; i < chaptersTotal; i++) {
            opt += '<tr><td id="chapter_' + (i + 1) + '">' + (i + 1) + '</td></tr>';
        }
        $('#main_bible_chapters').html('<div style="height: 100%; overflow-x: hidden; overflow-y: scroll;" id="div_chapters"><table id="bible_chapters" width="35px" cellspacing="0" border="0" cellpadding="2"></table></div>');
        $('#bible_chapters').html(opt);
        $('#chapter_1').addClass('selected');

        $('#main_bible_content').html('<div style="height: 100%; overflow-y: scroll; overflow-x: hidden;" id="bible_content"><table width="100%" id="content"></table></div>');

        loadBibleChapter(books[bookIndex], 1);

        $('#div_chapters').slimScroll({
            height: $(window).height() - $('#tabel_header').height() - 12
        });
    });

    $(document).on('click', "[id^='chapter']", function (event) {
        $('#bible_chapters .selected').removeClass('selected');
        $(this).css('cursor', 'pointer');
        var chapterId = $(this).attr("id").replace('chapter_', '');
        $("#chapter_" + chapterId).addClass('selected');

        var chapterIndex = $(this).attr("id").replace('chapter_', '');
        var bookIndex = $('#bible_books .selected').attr('id').replace('book_', '');
		loadBibleChapter(books[bookIndex], parseInt(chapterIndex));
    });

    $("#read").on('click', function(event) {
        var value = $('#read').val();
        if (value == 'Read chapter') {
            var text = $('#content').html();
            text = text.replace('<div>', '');
            text = text.replace('</div>', '');
            text = text.replace('<b>', '');
            text = text.replace('</b>', '');
            chrome.tts.speak(text);
            $('#read').val('Stop');
            
        } else {
            chrome.tts.stop();
            $('#read').val('Read chapter');
        }
    });

	function search_bible(input) {
		var words = input.match(/("[^"]+"|[^"\s]+)/g);
		
		for (var i = 0; i < words.length; i++) {
			words[i] = words[i].replace(/"/gi, '');
			words[i] = words[i].replace(/'/gi, '');
		}			
		
		document.getElementById('content').innerHTML = '';
		
		var view = getBibleView();
		view._database.transaction(function(query) { 
			var queryString = 'SELECT * FROM ' + localStorage['bible_version'] + ' WHERE ';
			for (var i = 0; i < words.length; i++) {
				words[i] = words[i].replace(/"/gi, '');
				queryString += ' text LIKE "%' + words[i] + '%" AND '
			}

			queryString = queryString.substr(0, queryString.length - 4);
						
			query.executeSql(queryString, [], 			
				function(transaction, result) { 
					var total = result.rows.length;
					document.getElementById('content').innerHTML = '<div>Search results ' + total + "</div>";
					document.getElementById('content').innerHTML += '<br />'
					for (var i = 0; i < total; i++) {			
						var opt = document.createElement("div");
						opt.innerHTML = '<b>' + result.rows.item(i).carte + ' ' +  parseInt(result.rows.item(i).capitol) + ':' + parseInt(result.rows.item(i).verset) + "</b>" + ' ' + ' '  + result.rows.item(i).text;
						document.getElementById('content').appendChild(opt);
					}
					for (var i = 0; i < words.length; i++)
						$('#content').highlight(words[i]);
				}		
			)
		});         	
	}
	
	$("#search_text").keypress(function(e) {
        if(e.keyCode == 13) {
        var q = $('#search_text').val();
		if (q.length > 3) 
			search_bible(q);
        }
    });
	
	$("#bible").change(function() {
		localStorage['bible_version'] = $('#bible').val();
		$('#content').children().remove();
		
		var bookIndex = $('#bible_books .selected').attr('id').replace('book_', '');
        var chapterIndex = $('#bible_chapters .selected').attr('id').replace('chapter_', '');

		loadBibleChapter(books[bookIndex], chapterIndex);
	});	
	
	$('#bible').val(localStorage['bible_version']);	
});