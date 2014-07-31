{
	"targets": [
		{
			"target_name": "kpion",
			"sources": [ "native/kpion.cc" ],
			"include_dirs": [ '<!(node -e "require(\'nan\')")' ],
			"libraries": [ "-lcryptopp" ],
			"cflags_cc!": [ "-fno-rtti", "-fno-exceptions" ],
			"conditions": [
				["OS=='mac'", {
					"xcode_settings": {
						"GCC_ENABLE_CPP_EXCEPTIONS": "NO",
						"GCC_ENABLE_CPP_RTTI": "YES",
						"OTHER_CPLUSPLUSFLAGS" : [ "-stdlib=libc++", "-mmacosx-version-min=10.7" ]
					}
				}]
			]
		}
	]
}
