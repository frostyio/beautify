local a = syn.request
setreadonly(syn, false)
local function b(c)
	table.foreach(c, function(d, e)
		if type(e) == "table" then
			print("{")
			b(e)
			print("}")else
			print(d, "=>", e)
		end
	end)
end
function request(...)
	print("-- log --")
	print("request parameters:")
	b({
		...
	})
	local f = {
				a(...)
	}
	print("results:")
	b(f)
	return unpack(f)
end
syn.request{
	Url = "https://httpbin.org/get",
	Method = "Get"
}