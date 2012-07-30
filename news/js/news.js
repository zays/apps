News={
	DropDownMenu: {
		fade:function(menu){
			$(menu).toggle();
			return false;
		},
		dropdown:function(button){
			var list = $(button).parent().find('ul#dropdownmenu');
			if (list.css('display') == 'none')
				list.slideDown('fast').show();
			else
				list.slideUp('fast');

			return false;
		},
		selectItem:function(item, folderid){
			var parent = $(item).parent().parent();
			parent.find('#dropdownBtn').text($(item).text());
			parent.find(':input[name="folderid"]').val(folderid);
			parent.find('ul#dropdownmenu').slideUp('fast');
		}
	},
	UI: {
		overview:function(dialogtype, dialogfile){
		    	if($(dialogtype).dialog('isOpen') == true){
				$(dialogtype).dialog('moveToTop');
			}else{
				$('#dialog_holder').load(OC.filePath('news', 'ajax', dialogfile), function(jsondata){
					if(jsondata.status != 'error'){
						if(dialogtype == '#import_dialog') {
							//TODO: group all the following calls in a method
							$('#browsebtn, #cloudbtn, #importbtn').hide();
							$('#cloudbtn, #cloudlink').click(function() {
								/*
								 * it needs to be filtered by MIME type, but there are too many MIME types corresponding to opml
								 * and filepicker doesn't support multiple MIME types filter.
								*/
								OC.dialogs.filepicker(t('news', 'Select file'), News.Opml.cloudFileSelected, false, '', true);
							});
							$('#browsebtn, #browselink').click(function() {
								$('#file_upload_start').trigger('click');
							});
							$('#file_upload_start').change(function() {
								News.Opml.browseFile(this.files);
							});
							$('#importbtn').click(function() {
								News.Opml.import(this);
							});
						}
						$(dialogtype).dialog({
							dialogClass:'dialog',
							minWidth: 600,
							close: function(event, ui) {
								$(this).dialog('destroy').remove();
							}
						}).css('overflow','visible');
					} else {
						alert(jsondata.data.message);
					}
				});
			}
			return false;
		}
	},
	Opml: {
		importpath:'',
		importkind:'',
		cloudFileSelected:function(path){
			$.getJSON(OC.filePath('news', 'ajax', 'selectfromcloud.php'),{'path':path},function(jsondata){
				if(jsondata.status == 'success'){
					$('#browsebtn, #cloudbtn, #importbtn').show();
					$("#opml_file").text(t('news', 'File ') + path + t('news', ' loaded from cloud.'));
					News.Opml.importkind = 'cloud';
					News.Opml.importpath = jsondata.data.tmp;
				}
				else{
					OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
				}
			});
		},
		browseFile:function(filelist){
			if(!filelist) {
				OC.dialogs.alert(t('news','No files selected.'), t('news', 'Error'));
				return;
			}
			var file = filelist[0];
			$("#browsebtn, #cloudbtn, #importbtn").show();
			$("#opml_file").text(t('news', 'File ') + file.name + t('news', ' loaded from local filesystem.'));
			$("#opml_file").prop('value', file.name);
		},
		import:function(button){
			$(button).attr("disabled", true);
			$(button).prop('value', t('news', 'Importing...'));

			var path = '';
			if (News.Opml.importkind == 'cloud') {
				path = News.Opml.importpath;
			} else {

			}

			$.post(OC.filePath('news', 'ajax', 'importopml.php'), { path: path }, function(jsondata){
				if (jsondata.status == 'success') {
					alert(jsondata.data.title);
				}
			});

		}
	},
	Folder: {
		submit:function(button){
			var displayname = $("#folder_add_name").val().trim();

			if(displayname.length == 0) {
				OC.dialogs.alert(t('news', 'Name of the folder cannot be empty.'), t('news', 'Error'));
				return false;
			}

			$(button).attr("disabled", true);
			$(button).prop('value', t('news', 'Adding...'));

			var folderid = $('#inputfolderid:input[name="folderid"]').val();

			var url;
			url = OC.filePath('news', 'ajax', 'createfolder.php');

			$.post(url, { name: displayname, parentid: folderid },
				function(jsondata){
					if(jsondata.status == 'success'){
						//$(button).closest('tr').prev().html(jsondata.page).show().next().remove();
						OC.dialogs.alert(jsondata.data.message, t('news', 'Success!'));
					} else {
						OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
					}
					$("#folder_add_name").val('');
					$(button).attr("disabled", false);
					$(button).prop('value', t('news','Add folder'));
			});
		},
		'delete':function(folderid) {
			$('#feeds_delete').tipsy('hide');
			OC.dialogs.confirm(t('news', 'Are you sure you want to delete this folder and all its feeds?'), t('news', 'Warning'), function(answer) {
				if(answer == true) {
					$.post(OC.filePath('news', 'ajax', 'deletefolder.php'),{'folderid':folderid},function(jsondata){
						if(jsondata.status == 'success'){
							//change this with actually removing the folder in the view instead of the alert msg
							alert('removed!');
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
						}
					});
				}
			});
			return false;
		}
	},
	Feed: {
		id:'',
		submit:function(button){
			var feedurl = $("#feed_add_url").val().trim();

			if(feedurl.length == 0) {
				OC.dialogs.alert(t('news', 'URL cannot be empty.'), t('news', 'Error'));
				return false;
			}

			$(button).attr("disabled", true);
			$(button).prop('value', t('news', 'Adding...'));

			var folderid = $('#inputfolderid:input[name="folderid"]').val();

			$.post(OC.filePath('news', 'ajax', 'createfeed.php'), { feedurl: feedurl, folderid: folderid },
				function(jsondata){
					if(jsondata.status == 'success'){
						OC.dialogs.alert(jsondata.data.message, t('news', 'Success!'));
					} else {
						OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
					}
				$("#feed_add_url").val('');
				$(button).attr("disabled", false);
				$(button).prop('value', t('news', 'Add feed'));
			});

		},
		'delete':function(feedid) {
			$('#feeds_delete').tipsy('hide');
			OC.dialogs.confirm(t('news', 'Are you sure you want to delete this feed?'), t('news', 'Warning'), function(answer) {
				if(answer == true) {
					$.post(OC.filePath('news', 'ajax', 'deletefeed.php'),{'feedid':feedid},function(jsondata){
						if(jsondata.status == 'success'){
							$('#leftcontent [data-id="'+jsondata.data.feedid+'"]').remove();
							//change the right view too (maybe a message to subscribe, like in Google Reader?)
						}
						else{
							OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
						}
					});
				}
			});
			return false;
		},
		markItem:function(itemid, feedid) {
			var currentitem = $('#rightcontent [data-id="' + itemid + '"]');
			if (currentitem.hasClass('title_unread')) {
				$.post(OC.filePath('news', 'ajax', 'markitem.php'),{'itemid':itemid},function(jsondata){
					if(jsondata.status == 'success'){
						currentitem.removeClass('title_unread');
						currentitem.addClass('title_read');

						// decrement counter
						var counterplace = $('.feeds_list[data-id="'+feedid+'"]').find('#unreaditemcounter');
						var oldcount = counterplace.html();
						counterplace.empty();
						if (--oldcount <= 0) {
							counterplace.removeClass('nonzero').addClass('zero');
						}
						else {
							counterplace.append(--oldcount);
						}
						//set a timeout for this
					}
					else{
						OC.dialogs.alert(jsondata.data.message, t('news', 'Error'));
					}
				})
			};
		},
		updateAll:function() {
			$.post(OC.filePath('news', 'ajax', 'feedlist.php'),function(jsondata){
				if(jsondata.status == 'success'){
					var feeds = jsondata.data;
					for (var i = 0; i < feeds.length; i++) {
						News.Feed.update(feeds[i]['id'], feeds[i]['url'], feeds[i]['folderid']);
					}
				}
				else {
					//TODO:handle error case
				}
			});
		},
		update:function(feedid, feedurl, folderid) {
			var counterplace = $('.feeds_list[data-id="'+feedid+'"]').find('#unreaditemcounter');
			var oldcount = counterplace.html();
			counterplace.removeClass('nonzero').addClass('zero');
			counterplace.html('<img style="vertical-align: middle;" src="' + OC.imagePath('core','loader.gif') + '" alt="refresh" />');
			$.post(OC.filePath('news', 'ajax', 'updatefeed.php'),{'feedid':feedid, 'feedurl':feedurl, 'folderid':folderid},function(jsondata){
				if(jsondata.status == 'success'){
					var newcount = jsondata.data.unreadcount;
					if (newcount > 0) {
						counterplace.addClass('nonzero');
						counterplace.html(newcount);
					}
					else {
						counterplace.html('');
					}
				}
				else{
				  	if (oldcount > 0) {
						counterplace.addClass('nonzero');
						counterplace.html(oldcount);
					}
				}

			});
		}
	}
}

function setupFeedList() {
    	$('.collapsable_container').click(function(){
		$(this).parent().children().toggle();
		$(this).toggle();
	});

	var list = $('.collapsable,.feeds_list').hover(
		function() {
			$(this).find('#feeds_delete,#feeds_edit').css('display', 'inline');
			$(this).find('#unreaditemcounter').css('display', 'none');
		},
		function() {
			$(this).find('#feeds_delete,#feeds_edit').css('display', 'none');
			$(this).find('#unreaditemcounter').css('display', 'inline');
		}
	);
	list.find('#feeds_delete').hide();
	list.find('#feeds_edit').hide();
	list.find('#unreaditemcounter').show();
}

$(document).ready(function(){

	$('#addfeed').click(function() {
		News.UI.overview('#addfeed_dialog','feeddialog.php');
	});
	$('#addfolder').click(function() {
		News.UI.overview('#addfolder_dialog','folderdialog.php');
	});

	$('.accordion .title_unread').click(function() {
		$(this).next().toggle();
		return false;
	}).next().hide();

	$('.accordion .title_read').click(function() {
		$(this).next().toggle();
		return false;
	}).next().hide();

	$('#addfeedfolder').click(function(event) {
	      event.stopPropagation();
	});

	$('#settingsbtn').click(function() {
		News.UI.overview('#import_dialog', 'importdialog.php');
	});

	setupFeedList();

	News.Feed.updateAll();
	var updateInterval = 200000; //how often the feeds should update (in msec)
	setInterval('News.Feed.updateAll()', updateInterval);

});

$(document).click(function(event) {
	$('#feedfoldermenu').hide();
});
